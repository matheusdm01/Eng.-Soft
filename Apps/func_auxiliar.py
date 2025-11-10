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

def safe_date_format(dt_obj):
    """Retorna a data no formato YYYY-MM-DD se for um objeto datetime, caso contrário None."""
    if dt_obj is None or isinstance(dt_obj, str):
        return None
    # Se for um datetime, extrai a parte da data e formatamos
    if hasattr(dt_obj, 'date'):
        dt_obj = dt_obj.date()
    return dt_obj.strftime('%Y-%m-%d')