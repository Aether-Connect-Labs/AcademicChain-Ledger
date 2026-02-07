const fs = require('fs');
const path = 'client/components/CertificateDesigner.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');

    // Fabric v7 Migration Replacements
    content = content.replace(/new fabric\.Canvas\(/g, 'new Canvas(');
    content = content.replace(/new fabric\.IText\(/g, 'new IText(');
    content = content.replace(/new fabric\.Rect\(/g, 'new Rect(');
    content = content.replace(/new fabric\.Shadow\(/g, 'new Shadow(');
    content = content.replace(/fabric\.Image\.fromURL/g, 'FabricImage.fromURL');

    fs.writeFileSync(path, content);
    console.log('Successfully updated CertificateDesigner.jsx');
} catch (err) {
    console.error('Error updating file:', err);
}
