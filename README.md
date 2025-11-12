# Eng.-Soft

Repositório de exemplo para as atividades da disciplina de Engenharia de Software da UFRN.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Como clonar ou baixar](#como-clonar-ou-baixar)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Licença](#licença)  

## Sobre o Projeto

### Título
Projeto de Engenharia de Software

### Descrição
Este projeto tem como objetivo mostrar as atividades realizadas na disciplina de Engenharia de Software da UFRN.

### Componentes
- FLÁVIO JOSÉ NUNES DE SOUZA
- MATHEUS DANTAS MELO
- NILTON FONTES BARRETO NETO

## Como clonar ou baixar

Você pode obter este repositório de três formas:

### Clonar via HTTPS

```bash
git clone https://github.com/matheusdm01/Eng.-Soft/.git
```

Isso criará uma cópia local do repositório em sua máquina.

### Clonar via SSH

Se você já configurou sua chave SSH no GitHub, pode clonar usando:

```bash
git clone git@github.com:matheusdm01/Eng.-Soft/.git
```

Isso criará uma cópia local do repositório em sua máquina.

### Baixar como ZIP

1. Acesse a página do repositório no GitHub:
   [https://github.com/matheusdm01/Eng.-Soft/](https://github.com/matheusdm01/Eng.-Soft/)
2. Clique no botão **Code** (verde).
3. Selecione **Download ZIP**.
4. Extraia o arquivo ZIP para o local desejado em seu computador.


## Estrutura do Projeto

> *Esta seção pode variar conforme a organização do repositório de cada grupo.*

```
Eng.-Soft/
├── LICENSE
├── README.md
├── manage.py
├── requirements.txt
├── Apps/
│   ├── tarefas/
│   ├── usuarios/
│   └── func_auxiliar.py
├── core/
│   ├── static/
│   └── templates/
├── Estrutura_do_projeto/
│   ├── Diagramas.txt
│   ├── Diagrama_comportamental.drawio.png
│   ├── Diagrama_estrutural.drawio.svg
│   ├── Padrões de Projeto Utilizados.txt
│   ├── Principios_de_Projeto
│   └── User_Stories
├── Gestao_de_atividades/
└── Popular_banco/
    ├── gerar_dados.py
    ├── popular.py
    ├── tarefas.xlsx
    └── usuarios.xlsx

```
- LICENSE: Termos da licença do projeto (MIT).
- README.md: Arquivo de apresentação e guia principal do projeto.
- manage.py: Script principal do Django, usado para executar e administrar o sistema.
- requirements.txt: Lista de dependências necessárias para rodar o projeto.
- Apps/: Contém os aplicativos Django e funções auxiliares do sistema.
- tarefas/: Responsável pela criação, listagem e gerenciamento de tarefas.
- usuarios/: Gerencia autenticação e informações de usuários.
- func_auxiliar.py: Funções utilitárias compartilhadas entre os aplicativos.
- core/: Contém os templates HTML e arquivos estáticos (CSS, JS e imagens) utilizados na interface do sistema.
- Estrutura_do_projeto/: Diretório que reúne os artefatos da disciplina de Engenharia de Software.
- Diagramas.txt: Arquivo de texto contendo explicações sobre as finalidades do uso dos diagramas comportamental e estrutural.
- Diagrama_comportamental.drawio.png: A imagem do diagrama comportamental das User Stories.
- Diagrama_estrutural.drawio.svg: A imagem do diagrama estrutural das User Stories.
- Padrões_de_Projeto_Utilizados.txt: Descrição dos padrões aplicados no desenvolvimento desse projeto.
- Principios_de_Projeto: Arquivo contendo uma breve explicações de alguns principios de engenharia de software e como eles estão implementados nesse projeto.
- User_Stories: Arquivo contendo 3 User Stories sobre do projeto de agenda virtual.
- Relatório.txt: Arquivo de texto contendo um relátorio explicativo sobre o projeto.
- Gestao_de_atividades/: Diretório de configuração principal do projeto Django (settings, urls, wsgi, etc.).
- Popular_banco/: Diretório com scripts e planilhas para popular o banco de dados.
- gerar_dados.py: Gera automaticamente dados de exemplo.
- popular.py: Insere os dados no banco.
- tarefas.xlsx / usuarios.xlsx: Planilhas contendo dados de exemplo para popular o sistema.

## Licença

Este projeto está licenciado sob a **Licença MIT**. Veja o arquivo `LICENSE` para mais detalhes.
