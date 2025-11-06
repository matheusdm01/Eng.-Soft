from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator

from Apps.usuarios.models import Usuario

class CardTarefa(models.Model):
    titulo = models.CharField(max_length=250)
    descricao = models.TextField(blank=True)
    arquivo = models.FileField(upload_to="arquivos/", blank=True, null=True)
    prazo = models.DateTimeField(null=True, blank=True)
    responsavel = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name="tarefas")
    subtarefas = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="parent_tarefas")
    concluido = models.BooleanField(default=False)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titulo} ({'Concluído' if self.concluido else 'Em progresso'})"

    @classmethod
    def create_card_tarefa(cls, titulo, descricao="", responsavel=None, prazo=None, arquivo=None):
        return cls.objects.create(
            titulo=titulo,
            descricao=descricao,
            responsavel=responsavel,
            prazo=prazo,
            arquivo=arquivo,
        )
    
    def add_subtarefa(self, titulo, descricao="", responsavel=None, prazo=None, arquivo=None):
        subtarefa = CardTarefa.objects.create(
            titulo=titulo,
            descricao=descricao,
            responsavel=responsavel,
            prazo=prazo,
            arquivo=arquivo,
        )
        self.subtarefas.add(subtarefa)
        return subtarefa

    def delete_tarefa(self):
        self.delete()

    def get_tarefas(self):
        return self.subtarefas.all()

    def get_responsavel(self):
        return self.responsavel

    def get_prazo(self):
        return self.prazo

    def get_data_criacao(self):
        return self.data_criacao

    def get_progresso(self):
        subt = self.subtarefas.all()
        if not subt:
            return 100 if self.concluido else 0
        total = subt.count()
        concluidas = subt.filter(concluido=True).count()

        # porcentagem de subtarefas concluídas
        return int((concluidas / total) * 100)

    def marcar_concluido(self, concluido=True):
        self.concluido = concluido
        self.save(update_fields=["concluido"])
        return self.concluido

    def set_card_tarefa(self, titulo=None, descricao=None, arquivo=None, prazo=None, responsavel=None, concluido=None):
        campos_alterados = []

        if titulo is not None and titulo != self.titulo:
            self.titulo = titulo
            campos_alterados.append("titulo")

        if descricao is not None and descricao != self.descricao:
            self.descricao = descricao
            campos_alterados.append("descricao")

        if arquivo is not None and arquivo != self.arquivo:
            self.arquivo = arquivo
            campos_alterados.append("arquivo")

        if prazo is not None and prazo != self.prazo:
            self.prazo = prazo
            campos_alterados.append("prazo")

        if responsavel is not None and responsavel != self.responsavel:
            self.responsavel = responsavel
            campos_alterados.append("responsavel")

        if concluido is not None and concluido != self.concluido:
            self.concluido = concluido
            campos_alterados.append("concluido")

        if campos_alterados:
            self.save(update_fields=campos_alterados)
            return True  # algo foi modificado

        return False  # nada mudou