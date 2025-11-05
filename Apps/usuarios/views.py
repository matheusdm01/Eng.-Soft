from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q

from .models import Usuario
from Apps.tarefas.models import CardTarefa

def login_view(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f"Bem-vindo, {user.nome}!")
            return redirect("home")
        else:
            messages.error(request, "E-mail ou senha incorretos.")

    return render(request, "login/login.html")

def logout_view(request):
    logout(request)
    return redirect("login")

@login_required
def kanban_view(request):
    usuario = request.user
    
    # Tarefas principais: que não são subtarefas de nenhuma outra
    if usuario.is_superuser:
        tarefas_principais = CardTarefa.objects.exclude(
            parent_tarefas__isnull=False
        ).distinct()
    else:
        tarefas_principais = CardTarefa.objects.filter(
            responsavel=usuario
        ).exclude(
            parent_tarefas__isnull=False
        ).distinct()

    atividades_pendentes = []
    atividades_fazendo = []
    atividades_concluidas = []

    for tarefa in tarefas_principais:
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
            elif 0 < concluidas_sub < total_sub and not tarefa.concluido:
                atividades_fazendo.append(tarefa)
            elif concluidas_sub == total_sub or tarefa.concluido:
                atividades_concluidas.append(tarefa)

    context = {
        'atividades_pendentes': atividades_pendentes,
        'atividades_fazendo': atividades_fazendo,
        'atividades_concluidas': atividades_concluidas,
    }

    return render(request, 'kanban.html', context)
