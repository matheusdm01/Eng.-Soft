from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('', views.kanban_view, name='home'),  

    # ROTAS DA API
    path('api/tarefas/', views.api_tarefas_lista, name='api_tarefas_lista'),
    path('api/tarefas/<int:pk>/', views.api_tarefas_detalhe, name='api_tarefas_detalhe'),

    # NOVO ENDPOINT: Para criar uma subtarefa para uma tarefa principal específica
    path('api/tarefas/<int:parent_pk>/subtarefas/', views.api_subtarefas_lista, name='api_subtarefas_lista'),
]