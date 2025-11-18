file_path = "c:\\Users\\Alumno.LAPTOP-72MR2U1M\\Documents\\AcademicChain-Ledger\\client\\AppRoutes.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Unicode escape sequences
content = content.replace('=\\u003e', '=\u003e')
content = content.replace('\\u003c', '\u003c')
content = content.replace('\\u003e', '\u003e')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Unicode escape sequences replaced successfully.")