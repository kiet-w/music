const fs = require('fs');
function convert(fileIn, fileOut, componentName) {
  let html = fs.readFileSync(fileIn, 'utf-8');
  let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return;
  let body = bodyMatch[1];
  
  // Basic React conversion
  body = body.replace(/class=/g, 'className=');
  body = body.replace(/for=/g, 'htmlFor=');
  body = body.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
  // self closing tags
  body = body.replace(/<(img|input|br|hr|meta|link)([^>]*?)([^\/])>/g, '<$1$2$3 />');
  // style strings to objects is hard with regex, let's just leave style out or convert common ones
  body = body.replace(/style="([^"]*)"/g, ""); // strip styles for simplicity, usually stitch doesn't use much inline style
  
  let jsx = `export default function ${componentName}() {
  return (
    <div className="dark bg-[#09090B] min-h-screen">
      ${body}
    </div>
  );
}`;
  fs.writeFileSync(fileOut, jsx);
}

convert('password-reset.html', 'src/app/password-reset/page.tsx', 'PasswordReset');
convert('friend-code.html', 'src/app/friend-code/page.tsx', 'FriendCode');
console.log('Converted');
