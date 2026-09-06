// const text = `
// Employees receive 20 days of paid annual leave.

// Employees can work remotely two days per week.

// The company provides health insurance to full-time employees.

// Employees must submit leave requests to their manager.
// `;

// const chunkSize = 100;
// const overlap = 20;

// const chunks = [];

// let start = 0;

// while (start < text.length) {

//     const end = start + chunkSize;

//     const chunk = text.slice(start, end);

//     chunks.push(chunk);

//     start += chunkSize - overlap;
// }

// console.log(chunks);



const text = `
Employees receive 20 days of paid annual leave.

Employees can work remotely two days per week.

The company provides health insurance to full-time employees.

Employees must submit leave requests to their manager.
`;

const paragraphs = text
    .split("\n\n")
    .filter(paragraph => paragraph.trim() !== "");

console.log(paragraphs);