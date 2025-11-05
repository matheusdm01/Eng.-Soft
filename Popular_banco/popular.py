import pandas as pd
from datetime import datetime
from random import choice
import os
import sys
import django
from django.utils.timezone import make_aware
from django.utils import timezone

# --- Configuração do Django ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Gestao_de_atividades.settings")
django.setup()

# --- Importa os modelos ---
from Apps.usuarios.models import Usuario
from Apps.tarefas.models import CardTarefa

# --- Leitura das planilhas ---
usuarios_df = pd.read_excel("Popular_banco/usuarios.xlsx")
tarefas_df = pd.read_excel("Popular_banco/tarefas.xlsx")

# --- Popular o banco de usuários ---
for _, row in usuarios_df.iterrows():
    email = row["email"]
    if not Usuario.objects.filter(email=email).exists():
        Usuario.objects.create_user(
            email=email,
            nome=row["nome"],
            cpf=row["cpf"],
            phone=row["phone"],
            password=row["senha"]
        )
print(f"{len(usuarios_df)} usuários carregados (ou já existentes).")

# --- Lista de usuários disponíveis ---
usuarios = list(Usuario.objects.all())

# --- Popular o banco de tarefas ---
# ---- Criar todas as tarefas e armazenar por índice ---
tarefa_map = {}  # chave: ID real da tarefa, valor: objeto CardTarefa

for _, row in tarefas_df.iterrows():
    responsavel = choice(usuarios) if usuarios else None
    prazo = None

    if not pd.isna(row["prazo"]):
        data_str = str(row["prazo"]).strip()
        try:
            prazo = datetime.strptime(data_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                prazo = datetime.strptime(data_str, "%Y-%m-%d")
            except ValueError:
                try:
                    prazo = pd.to_datetime(row["prazo"])
                except Exception:
                    prazo = None

    if prazo is not None and timezone.is_naive(prazo):
        prazo = make_aware(prazo)

    tarefa = CardTarefa.objects.create(
        titulo=row["titulo"],
        descricao=row["descricao"],
        prazo=prazo,
        responsavel=responsavel,
        concluido=bool(row["concluido"])
    )

    tarefa_map[tarefa.id] = tarefa  # usa o ID real como chave

# ---- Associar subtarefas ---
for tarefa_id, tarefa in tarefa_map.items():
    row = tarefas_df.loc[tarefas_df.index[tarefa_id - 1]]  # cuidado: só funciona se IDs forem sequenciais

    subtarefas_ids = str(row.get("subtarefas_ids", "")).strip()
    if subtarefas_ids:
        ids = [int(x) for x in subtarefas_ids.split(",") if x.strip().isdigit()]
        subtarefas = [tarefa_map[i] for i in ids if i in tarefa_map]
        tarefa.subtarefas.set(subtarefas)
        # print(f"Associando subtarefas para tarefa {tarefa.id}: {ids}")
