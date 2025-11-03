from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth import logout

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

def kanban_view(request):
    return render(request, 'kanban.html')
