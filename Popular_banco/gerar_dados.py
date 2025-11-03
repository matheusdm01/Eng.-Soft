import random
import pandas as pd
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('pt_BR')

usuarios = []
for i in range(5):
    nome = fake.name()
    email = f"{nome.split()[0].lower()}{i}@exemplo.com"
    cpf = fake.cpf()
    phone = fake.phone_number()
    senha = "senha123"
    usuarios.append({
        "id": i + 1,
        "nome": nome,
        "cpf": cpf,
        "email": email,
        "phone": phone,
        "senha": senha
    })

# Salvar planilha de usuários
usuarios_df = pd.DataFrame(usuarios)
usuarios_df.to_excel("usuarios.xlsx", index=False)
print("✅ Planilha 'usuarios.xlsx' criada com sucesso.")

# ======================
tarefas = []
num_tarefas = 100

for i in range(1, num_tarefas + 1):
    titulo = fake.sentence(nb_words=5).replace(".", "")
    descricao = fake.paragraph(nb_sentences=2)
    responsavel_id = random.choice(usuarios)["id"]
    prazo = datetime.now() + timedelta(days=random.randint(1, 90))
    concluido = random.choice([True, False])
    data_criacao = datetime.now() - timedelta(days=random.randint(0, 30))

    tarefas.append({
        "id": i,
        "titulo": titulo,
        "descricao": descricao,
        "prazo": prazo.strftime("%Y-%m-%d %H:%M:%S"),
        "responsavel_id": responsavel_id,
        "concluido": concluido,
        "data_criacao": data_criacao.strftime("%Y-%m-%d %H:%M:%S")
    })

# Adicionar subtarefas aleatórias (ligadas entre si)
for tarefa in tarefas:
    if random.random() < 0.3:  # 30% das tarefas terão subtarefas
        subtarefas_ids = random.sample(range(1, num_tarefas + 1), k=random.randint(1, 3))
        tarefa["subtarefas_ids"] = ",".join(str(sid) for sid in subtarefas_ids if sid != tarefa["id"])
    else:
        tarefa["subtarefas_ids"] = ""

# Salvar planilha de tarefas
tarefas_df = pd.DataFrame(tarefas)
tarefas_df.to_excel("tarefas.xlsx", index=False)
print("✅ Planilha 'tarefas.xlsx' criada com sucesso.")
