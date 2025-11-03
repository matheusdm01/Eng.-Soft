import os
import django
import pandas as pd
from datetime import datetime, timedelta
from random import choice

# --- CONFIGURA DJANGO ---
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Gestao_de_atividades")
django.setup()

from usuarios.models import Usuario
from tarefas.models import CardTarefa

# --- 1️⃣ CARREGA USUÁRIOS ---
usuarios_df = pd.read_excel("usuarios.xlsx")

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
print(f"✅ {len(usuarios_df)} usuários carregados (ou já existentes).")

# --- 2️⃣ CARREGA TAREFAS ---
tarefas_df = pd.read_excel("tarefas.xlsx")
usuarios = list(Usuario.objects.all())

for _, row in tarefas_df.iterrows():
    responsavel = choice(usuarios) if usuarios else None
    prazo = None
    if not pd.isna(row["prazo"]):
        prazo = datetime.strptime(str(row["prazo"]), "%Y-%m-%d")

    tarefa = CardTarefa.objects.create(
        titulo=row["titulo"],
        descricao=row["descricao"],
        prazo=prazo,
        responsavel=responsavel,
        concluido=bool(row["concluido"])
    )

print(f"✅ {len(tarefas_df)} tarefas carregadas.")
