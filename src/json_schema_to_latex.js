export default function json_schema_to_latex(schema, parent = null) {
    if (schema.label && (!Array.isArray(schema.label) || schema.label.some(l => typeof l !== 'string'))) {
        throw new Error('Non-array / non-string label(s) is not allowed');
    }
    if (schema.type === 'heading' || schema.type === 'subheading') {
        const label = schema.label.join('\n \\\\');
        return [
            "\\" + schema.type + "\{" + label + '}',
            ...(schema.elements || []).map(elem => json_schema_to_latex(elem, schema)),
        ].join('\n');
    }
    if (schema.type === 'spaced-collection') {
        return (schema.elements || []).map(elem => json_schema_to_latex(elem, schema)).join('%\n \\vspace{0.5cm} \\\\ %\n %\n')
    }
    const label = (schema.label || []).join('\n');
    if (schema.type === 'skill-table') {
        return [
            "\\begin{tabular}{|p{5cm}p{10cm}|l|}",
            "\\hline",
            `\\rowcolor[gray]{0.8} \\textbf{${label}} & & \\\\`,
            "\\hline",
            ...schema.elements.map(elem => json_schema_to_latex(elem, schema)),
            "\\hline",
            "\\end{tabular}",
        ].join('\n')
    }
    if (schema.type === 'skill-row') {
        const { proficiency } = schema.options || {};
        if (!proficiency) {
            throw new Error('Nullish / zero proficiency is not allowed');
        }
        const proficiencyColor = (() => {
            if (proficiency >= 0.75)    return "parisgreen";
            if (proficiency >= 0.45)    return "chromeyellow";
            else                        return "red";
        })();
        return [
            label,
            `\\textcolor{${proficiencyColor}}{\\rule[0.5mm]{${schema.options.proficiency * 10}cm}{0.1cm}}`,
            `${schema.options.proficiency * 100}\\\%`
        ].join(' & ') + ' \\\\';
    }
    if (schema.type === 'ol') {
        return [
            label,
            /^(ul|ol)$/.test(parent?.type) ? "\\vspace{-.5\\topsep}" : null,
            "\\begin{enumerate}",
            "\\setlength\\parsep{0pt}",
            "\\setlength\\itemsep{0pt}",
            ...schema.elements.map(elem => '\\item ' + json_schema_to_latex(elem, schema)),
            "\\end{enumerate}",
            /^(ul|ol)$/.test(parent?.type) ? "\\vspace{-.5\\topsep}" : null,
        ].filter(Boolean).join('\n');
    }
    if (schema.type === 'ul') {
        return [
            label,
            /^(ul|ol)$/.test(parent?.type) ? "\\vspace{-.5\\topsep}" : null,
            "\\begin{itemize}",
            "\\setlength\\parsep{0pt}",
            "\\setlength\\itemsep{0pt}",
            ...(schema.elements || []).map(elem => '\\item ' + json_schema_to_latex(elem, schema)),
            "\\end{itemize}",
            /^(ul|ol)$/.test(parent?.type) ? "\\vspace{-.5\\topsep}" : null,            
        ].filter(Boolean).join('\n');
    }
    if (schema.type === 'text') {
        return label;
    }
    throw new Error('unreachable schema type is not allowed: ' + schema.type);
}
