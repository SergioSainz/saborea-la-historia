import csv
import json
from collections import Counter

# Definir los ingredientes objetivo
target_ingredients = ["MAIZ", "FRIJOL", "CHILE", "CALABAZA", "CACAO"]

# Inicializar el diccionario de resultados
results = {}
for ing in target_ingredients:
    results[ing.lower()] = {
        "estados": [],
        "culturas": [],
        "nota": ""
    }

# Contadores para cada ingrediente
estados_counters = {ing: Counter() for ing in target_ingredients}
culturas_counters = {ing: Counter() for ing in target_ingredients}
notas_culturales = {ing: set() for ing in target_ingredients}

# Leer el archivo CSV
with open('json/platillos_expandido.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter='|')
    next(reader)  # Saltar la cabecera
    
    for row in reader:
        if len(row) < 22:
            continue  # Saltar filas incompletas
            
        ingrediente = row[13].strip()  # Columna 14 (índice 13)
        
        if ingrediente in target_ingredients:
            estado = row[19].strip()  # Columna 20 (índice 19)
            cultura = row[20].strip()  # Columna 21 (índice 20)
            nota = row[21].strip()  # Columna 22 (índice 21)
            
            if estado:
                estados_counters[ingrediente][estado] += 1
            
            if cultura:
                culturas_counters[ingrediente][cultura] += 1
                
            if nota and len(nota) > 10:  # Solo considerar notas con contenido
                notas_culturales[ingrediente].add(nota)

# Procesar los contadores y generar el resultado final
for ing in target_ingredients:
    ing_lower = ing.lower()
    
    # Top 5 estados
    results[ing_lower]["estados"] = [
        {"name": estado, "value": count}
        for estado, count in estados_counters[ing].most_common(5)
    ]
    
    # Top 5 culturas
    results[ing_lower]["culturas"] = [
        {"name": cultura, "value": count}
        for cultura, count in culturas_counters[ing].most_common(5)
    ]
    
    # Una muestra de nota cultural
    if notas_culturales[ing]:
        results[ing_lower]["nota"] = list(notas_culturales[ing])[0]

# Guardar los resultados en un archivo JSON
with open('json/ingredientes_stats.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Análisis completado. Resultados guardados en 'json/ingredientes_stats.json'")