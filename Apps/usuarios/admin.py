from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Campos mostrados na lista principal
    list_display = (
        "id", "email", "nome", "cpf", "phone", "is_active", "is_staff", "date_joined"
    )

    # Campos de busca
    search_fields = ("email", "nome", "cpf", "phone")

    # Filtros laterais
    list_filter = ("is_active", "is_staff", "is_superuser")

    # Ordenação padrão
    ordering = ("-date_joined",)

    # Campos somente leitura
    readonly_fields = ("date_joined", "last_login")

    # Organização do formulário de edição
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informações pessoais", {"fields": ("nome", "cpf", "phone")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas importantes", {"fields": ("last_login", "date_joined")}),
    )

    # Campos exibidos ao adicionar um novo usuário no admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nome", "cpf", "phone", "password1", "password2", "is_staff", "is_active"),
        }),
    )

    # Título da seção no admin
    def __str__(self):
        return self.email
