from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404

from Apps.tarefas.models import Usuario
from Apps.tarefas.models import CardTarefa

from func_auxiliar import serialize_subtarefas, default_json_serializer, safe_date_format

@login_required
def kanban_view(request):
    usuario = request.user
    
    # Tarefas principais: que não são subtarefas de nenhuma outra
    if usuario.is_superuser:
        tarefas_principais = CardTarefa.objects.exclude(parent_tarefas__isnull=False).distinct().prefetch_related('subtarefas')
    else:
        tarefas_principais = CardTarefa.objects.filter(responsavel=usuario).exclude(parent_tarefas__isnull=False).distinct().prefetch_related('subtarefas')

    atividades_pendentes = []
    atividades_fazendo = []
    atividades_concluidas = []

    for tarefa in tarefas_principais:
        tarefa.subtarefas_json = serialize_subtarefas(tarefa)

        subtarefas = tarefa.subtarefas.all()
        total_sub = subtarefas.count()
        concluidas_sub = subtarefas.filter(concluido=True).count()
        
        if total_sub == 0:
            if tarefa.concluido:
                atividades_concluidas.append(tarefa)
            else:
                atividades_pendentes.append(tarefa)
        else:
            if concluidas_sub == 0 and not tarefa.concluido:
                atividades_pendentes.append(tarefa)
            elif 0 < concluidas_sub < total_sub: 
                atividades_fazendo.append(tarefa)
            elif concluidas_sub == total_sub or tarefa.concluido:
                atividades_concluidas.append(tarefa)

    context = {
        'atividades_pendentes': atividades_pendentes,
        'atividades_fazendo': atividades_fazendo,
        'atividades_concluidas': atividades_concluidas,
    }

    return render(request, 'kanban.html', context)

@csrf_exempt
def api_tarefas_lista(request):
    """
    Trata POST para criar uma nova tarefa principal.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # 1. Limpeza do INPUT (CORREÇÃO para evitar salvar "" no campo datetime)
            prazo_input = data.get('prazo')
            if prazo_input == '':
                prazo_input = None
            
            # 2. Criação do Objeto
            nova_tarefa = CardTarefa.objects.create(
                titulo=data.get('titulo'),
                descricao=data.get('descricao', ''),
                responsavel=request.user, 
                prazo=prazo_input, # Usa a variável limpa (None ou data)
                arquivo=data.get('arquivo'),
                concluido=False
            )
            
            # 3. Retorno JSON (AGORA USANDO O FORMATADOR SEGURO)
            return JsonResponse({
                'pk': nova_tarefa.pk,
                'titulo': nova_tarefa.titulo,
                'descricao': nova_tarefa.descricao,
                
                # Usa a função segura para formatar as datas
                'prazo': safe_date_format(nova_tarefa.prazo),
                'data_criacao': safe_date_format(nova_tarefa.data_criacao),
                
                'arquivo': nova_tarefa.arquivo.url if nova_tarefa.arquivo else None,
                'concluido': nova_tarefa.concluido
            }, status=201)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            # Retorna o erro real para debug (caso haja outro problema)
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Método não permitido'}, status=405)


@csrf_exempt
def api_tarefas_detalhe(request, pk):
    """
    Trata PATCH para atualizar (mover/concluir) e DELETE para excluir.
    """
    tarefa = get_object_or_404(CardTarefa, pk=pk)
    
    if not (request.user.is_superuser or tarefa.responsavel == request.user):
        return JsonResponse({'error': 'Não autorizado'}, status=403)

    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
            
            # 1. Atualiza campos:
            if 'concluido' in data:
                tarefa.concluido = data['concluido']
                
            if 'titulo' in data:
                tarefa.titulo = data['titulo']

            tarefa.save()
            
            # 2. Retorna a tarefa atualizada
            return JsonResponse({
                'pk': tarefa.pk,
                'titulo': tarefa.titulo,
                'descricao': tarefa.descricao,
                'prazo': tarefa.prazo.isoformat() if tarefa.prazo else None,
                'concluido': tarefa.concluido,
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    elif request.method == 'DELETE':
        tarefa.delete()
        # 204 No Content indica sucesso sem retorno de corpo.
        return HttpResponse(status=204) 

    return JsonResponse({'error': 'Método não permitido'}, status=405)

@csrf_exempt
def api_subtarefas_lista(request, parent_pk):
    """
    Trata POST para criar uma nova subtarefa e associá-la à tarefa principal (parent_pk).
    """
    # 1. Busca a tarefa principal
    parent_tarefa = get_object_or_404(CardTarefa, pk=parent_pk)
    
    if not (request.user.is_superuser or parent_tarefa.responsavel == request.user):
        return JsonResponse({'error': 'Não autorizado a adicionar subtarefas.'}, status=403)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # 2. Cria a subtarefa
            nova_subtarefa = CardTarefa.objects.create(
                titulo=data.get('titulo'),
                responsavel=request.user, 
                concluido=False,
            )
            
            # 3. Associa a nova subtarefa à tarefa principal
            parent_tarefa.subtarefas.add(nova_subtarefa) 
            parent_tarefa.save() # Salva a tarefa principal para garantir a associação

            # 4. Retorna os dados da subtarefa criada para o JS atualizar a lista
            return JsonResponse({
                'id': nova_subtarefa.pk,
                'title': nova_subtarefa.titulo,
                'done': nova_subtarefa.concluido,
                'desc': nova_subtarefa.descricao,
                'deadline': nova_subtarefa.prazo.isoformat() if nova_subtarefa.prazo else None,
            }, status=201)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Método não permitido'}, status=405)