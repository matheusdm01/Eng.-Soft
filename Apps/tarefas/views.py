from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from func_auxiliar import serialize_subtarefas, default_json_serializer

from Apps.tarefas.models import Usuario
from Apps.tarefas.models import CardTarefa


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
