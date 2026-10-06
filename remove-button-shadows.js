const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // A regex to find button or Link elements, and within their className, remove shadow-*
  // Since parsing HTML with regex is hard, we can just find typical button classNames.
  // Actually, let's just find <button and <Link tags and remove shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl, shadow from them.
  
  // A safer approach: just remove shadow from anything that looks like a button class string,
  // Or just find all <button... > blocks.
  
  const tagRegex = /<(?:button|Link)[\s\S]*?>/g;
  content = content.replace(tagRegex, match => {
    return match.replace(/\s+shadow(?:-sm|-md|-lg|-xl|-2xl|-inner|-none)?/g, '');
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    changedFiles++;
  }
});
console.log('Total files changed:', changedFiles);
