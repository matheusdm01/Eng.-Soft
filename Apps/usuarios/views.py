from django.shortcuts import render

def login_view(request):
    # Página de login (estática por enquanto)
    return render(request, 'usuarios/login.html')

def kanban_view(request):
    # Página principal (kanban)
    return render(request, 'usuarios/kanban.html')
