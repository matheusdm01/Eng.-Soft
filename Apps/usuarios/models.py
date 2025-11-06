from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils import timezone

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome, cpf, phone=None, password=None):
        if not email:
            raise ValueError("O usuário deve ter um endereço de email")
        if not cpf:
            raise ValueError("O usuário deve ter um CPF")

        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, cpf=cpf, phone=phone or "")
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome=None, cpf=None, password=None):
        nome = nome or "Administrador"
        cpf = cpf or "000.000.000-00"
        user = self.create_user(email=email, nome=nome, cpf=cpf, password=password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class Usuario(AbstractBaseUser, PermissionsMixin):
    """Usuário personalizado com autenticação via email."""

    nome = models.CharField(max_length=200)
    cpf = models.CharField(
        max_length=14,
        unique=True,
        validators=[RegexValidator(r"^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$", "Formato de CPF inválido")],
        help_text="Formato: 000.000.000-00",
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)

    # Campos obrigatórios para AbstractBaseUser
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    # Define o campo usado para login
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # Conecta o modelo ao gerenciador personalizado
    objects = UsuarioManager()

    @classmethod
    def criar_usuario(cls, nome, cpf, email, senha, phone=None):
        return cls.objects.create_user(email=email, nome=nome, cpf=cpf, password=senha, phone=phone)

    def set_nome(self, nome):
        self.nome = nome
        self.save(update_fields=["nome"])
        return self.nome

    def set_email(self, email):
        self.email = email
        self.save(update_fields=["email"])
        return self.email

    def set_phone(self, phone):
        self.phone = phone
        self.save(update_fields=["phone"])
        return self.phone

    def set_senha(self, senha):
        self.set_password(senha)
        self.save(update_fields=["password"])
        return True

    def get_nome(self):
        return self.nome

    def get_phone(self):
        return self.phone
