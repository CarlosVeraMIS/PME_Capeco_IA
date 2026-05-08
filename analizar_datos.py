import pandas as pd
import sys

try:
    df_usuarios = pd.read_excel('/Users/millennial/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/usuarios_capeco.xlsx')
    
    print("Columnas en usuarios_capeco.xlsx:")
    print(df_usuarios.columns)
    
    # Intenta encontrar clientes (empresas/instituciones)
    if 'Empresa' in df_usuarios.columns:
        print(f"Número de clientes (Empresas) en usuarios_capeco.xlsx: {df_usuarios['Empresa'].nunique()}")
    else:
        print(f"Número de usuarios en usuarios_capeco.xlsx: {len(df_usuarios)}")
except Exception as e:
    print(f"Error reading usuarios: {e}")

try:
    df_data = pd.read_excel('/Users/millennial/Library/CloudStorage/OneDrive-MSFT/mis/IA/capeco/data2025Q4.xlsx')
    
    print("\nColumnas en data2025Q4.xlsx:")
    print(df_data.columns)
    
    # Intenta encontrar distritos
    if 'Distrito' in df_data.columns:
        print(f"Número de distritos en data2025Q4.xlsx: {df_data['Distrito'].nunique()}")
        print(df_data['Distrito'].unique()[:10]) # Imprime algunos para ver
except Exception as e:
    print(f"Error reading data: {e}")
