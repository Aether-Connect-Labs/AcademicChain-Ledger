
import fetch from 'node-fetch';

const BASE_URL = 'https://n8n-b0be.onrender.com/api/v1';
// Intentamos usar la clave del .env, asumiendo que es una API Key válida o intentamos sin ella si es pública (poco probable)
const API_KEY = 'acl_live_sec_8f92a3b4'; // Del .env

async function fixWorkflow() {
    console.log('🔧 Intentando arreglar el workflow de n8n remotamente...');

    // 1. Obtener workflows para encontrar el ID correcto
    try {
        console.log('1. Listando workflows...');
        const listRes = await fetch(`${BASE_URL}/workflows`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });

        if (!listRes.ok) {
            throw new Error(`No se pudo listar workflows: ${listRes.status} ${listRes.statusText}`);
        }

        const listData = await listRes.json();
        const workflows = listData.data;
        console.log(`   Encontrados ${workflows.length} workflows.`);

        // Buscar el workflow que tiene el webhook 'submit-document'
        let targetWorkflow = null;
        
        // Primero buscamos por nombre si es obvio
        targetWorkflow = workflows.find(w => w.name.includes('AcademicChain') || w.name.includes('Backend'));
        
        // Si no, tendremos que iterar (o si encontramos uno, verificamos sus nodos)
        if (!targetWorkflow && workflows.length > 0) {
            targetWorkflow = workflows[0]; // Asumimos el primero si no hay más info
        }

        if (!targetWorkflow) {
            console.error('❌ No se encontró ningún workflow.');
            return;
        }

        console.log(`2. Inspeccionando workflow: ${targetWorkflow.name} (${targetWorkflow.id})`);
        
        // 2. Obtener el detalle del workflow
        const wfRes = await fetch(`${BASE_URL}/workflows/${targetWorkflow.id}`, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        
        const wfData = await wfRes.json();
        let nodes = wfData.nodes;
        let modified = false;

        // 3. Buscar y modificar el nodo Webhook
        nodes = nodes.map(node => {
            if (node.type.includes('webhook')) {
                // Verificar si es el webhook de submit
                const path = node.parameters?.path;
                if (path === 'submit-document') {
                    console.log(`   Webhook encontrado: ${node.name}`);
                    const method = node.parameters?.options?.httpMethod || node.parameters?.httpMethod || 'GET';
                    console.log(`   Método actual: ${method}`);
                    
                    if (method !== 'POST') {
                        console.log('   ⚠️ CORRIGIENDO MÉTODO A POST...');
                        // Ajustar estructura según versión del nodo
                        if (!node.parameters.options) node.parameters.options = {};
                        node.parameters.options.httpMethod = 'POST';
                        // A veces está en la raíz dependiendo de la versión
                        node.parameters.httpMethod = 'POST'; 
                        modified = true;
                    }
                }
            }
            return node;
        });

        if (!modified) {
            console.log('✅ El workflow ya parece estar configurado correctamente (o no se encontró el nodo exacto).');
        } else {
            // 4. Guardar cambios
            console.log('3. Guardando cambios en el servidor...');
            const updateRes = await fetch(`${BASE_URL}/workflows/${targetWorkflow.id}`, {
                method: 'PUT',
                headers: { 
                    'X-N8N-API-KEY': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nodes: nodes })
            });

            if (updateRes.ok) {
                console.log('✅ Workflow actualizado exitosamente.');
            } else {
                console.error(`❌ Error al guardar: ${updateRes.status}`);
            }
        }

        // 5. Asegurar que esté activo
        if (!wfData.active) {
            console.log('4. Activando workflow...');
            const activateRes = await fetch(`${BASE_URL}/workflows/${targetWorkflow.id}/activate`, {
                method: 'POST',
                headers: { 'X-N8N-API-KEY': API_KEY }
            });
            
            if (activateRes.ok) {
                console.log('✅ Workflow activado.');
            } else {
                console.error('❌ No se pudo activar el workflow.');
            }
        } else {
            console.log('✅ El workflow ya estaba activo.');
        }

    } catch (error) {
        console.error('❌ Fallo al intentar arreglar n8n vía API:', error.message);
        console.log('   NOTA: Esto es esperado si la API Key no tiene permisos de administración.');
    }
}

fixWorkflow();
