import pandas as pd
from datetime import datetime
from random import choice
import os
import sys
import django

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
for _, row in tarefas_df.iterrows():
    responsavel = choice(usuarios) if usuarios else None
    prazo = None

    # Tenta converter a data de forma flexível
    if not pd.isna(row["prazo"]):
        data_str = str(row["prazo"]).strip()
        try:
            prazo = datetime.strptime(data_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                prazo = datetime.strptime(data_str, "%Y-%m-%d")
            except ValueError:
                try:
                    # Pandas consegue ler formatos mistos (excel, etc)
                    prazo = pd.to_datetime(row["prazo"])
                except Exception:
                    prazo = None

    CardTarefa.objects.create(
        titulo=row["titulo"],
        descricao=row["descricao"],
        prazo=prazo,
        responsavel=responsavel,
        concluido=bool(row["concluido"])
    )

print(f"{len(tarefas_df)} tarefas carregadas.")
