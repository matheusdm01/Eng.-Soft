from django.contrib import admin
from .models import CardTarefa


@admin.register(CardTarefa)
class CardTarefaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "titulo",
        "responsavel",
        "prazo",
        "concluido",
        "get_tarefas_pai",
        "get_progresso_display",
        "data_criacao",
    )
    list_filter = ("concluido", "responsavel", "prazo", "data_criacao")
    search_fields = ("titulo", "descricao", "responsavel__email", "responsavel__nome")
    ordering = ("-data_criacao",)
    readonly_fields = ("data_criacao", "mostrar_subtarefas")
    list_editable = ("concluido",)

    fieldsets = (
        ("Informações principais", {
            "fields": ("titulo", "descricao", "arquivo", "responsavel", "prazo", "concluido"),
        }),
        ("Subtarefas", {
            "fields": ("subtarefas", "mostrar_subtarefas"),
            "description": "As subtarefas podem ser adicionadas e visualizadas aqui.",
        }),
        ("Datas", {"fields": ("data_criacao",)}),
    )

    def get_tarefas_pai(self, obj):
        """Mostra as tarefas que incluem esta como subtarefa."""
        pais = obj.parent_tarefas.all()
        return ", ".join(p.titulo for p in pais) if pais.exists() else "—"
    get_tarefas_pai.short_description = "Tarefa Pai"

    def get_progresso_display(self, obj):
        """Mostra o progresso das subtarefas como porcentagem."""
        try:
            progresso = obj.get_progresso()
            return f"{progresso}%"
        except Exception:
            return "—"
    get_progresso_display.short_description = "Progresso"

    def mostrar_subtarefas(self, obj):
        """Exibe uma lista HTML das subtarefas relacionadas."""
        subtarefas = obj.subtarefas.all()
        if not subtarefas.exists():
            return "— Nenhuma subtarefa —"
        html = "<ul style='margin:0;padding-left:18px;'>"
        for st in subtarefas:
            status = "✅" if st.concluido else "⏳"
            html += f"<li>{status} <a href='/admin/app_name/cardtarefa/{st.id}/change/'>{st.titulo}</a></li>"
        html += "</ul>"
        return html

    mostrar_subtarefas.allow_tags = True  # compatibilidade (não é mais obrigatório em Django 3+)
    mostrar_subtarefas.short_description = "Subtarefas"