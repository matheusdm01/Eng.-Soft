import json
from datetime import date, datetime

# Serializar objetos datetime
def default_json_serializer(obj):
    # Verifica se o objeto é uma instância de datetime ou date
    if isinstance(obj, (datetime, date)): 
        # Usa o método isoformat() que transforma a data/hora em uma string padrão (ex: "2023-10-27T10:00:00")
        return obj.isoformat()
    # Se o objeto não for serializável, levanta um erro
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

# Serializar as subtarefas
def serialize_subtarefas(tarefa):
    subtarefas_list = []
    for subt in tarefa.subtarefas.all():
        subtarefas_list.append({
            'id': subt.pk,
            'title': subt.titulo,
            'done': subt.concluido,
            'desc': subt.descricao,
            # O campo 'prazo' é um DateTimeField, que precisa ser serializado.
            'deadline': subt.prazo.isoformat() if subt.prazo else None,
        })
    
    # Converte a lista em uma string JSON, usando o serializador customizado
    return json.dumps(subtarefas_list, default=default_json_serializer)