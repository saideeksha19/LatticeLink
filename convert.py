import re
import os

with open('LatticeLink_Landing_Page.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract body content (excluding the <script> at the bottom)
body_match = re.search(r'<body[^>]*>(.*?)</script>\s*</body>', html, re.DOTALL | re.IGNORECASE)
if not body_match:
    print('Could not extract body')
    exit(1)

body_html = body_match.group(1)

# convert class to className
jsx = body_html.replace('class=', 'className=')
# fix inline styles (only one known case)
jsx = jsx.replace('style="font-variation-settings: \'FILL\' 1;"', 'style={{ fontVariationSettings: "\'FILL\' 1" }}')
# self-close img tags
jsx = re.sub(r'<img([^>]*?)(?<!/)>', r'<img\1 />', jsx)
jsx = re.sub(r'<input([^>]*?)(?<!/)>', r'<input\1 />', jsx)
jsx = re.sub(r'<br([^>]*?)(?<!/)>', r'<br\1 />', jsx)
jsx = re.sub(r'<hr([^>]*?)(?<!/)>', r'<hr\1 />', jsx)
# html comments to jsx comments
jsx = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', jsx, flags=re.DOTALL)

# Add onNavigate to Get Started / Connect buttons
# We'll just replace all <button class="primary-gradient... "> to include onClick={...}
jsx = jsx.replace('<button className="primary-gradient', '<button onClick={() => onNavigate(\'auth\')} className="primary-gradient')
jsx = jsx.replace('href="#"', 'href="#" onClick={(e) => { e.preventDefault(); onNavigate(\'auth\'); }}')
jsx = jsx.replace('href="#network"', 'href="#network" onClick={(e) => { e.preventDefault(); document.getElementById(\'network\').scrollIntoView({behavior:\'smooth\'}); }}')
jsx = jsx.replace('href="#security"', 'href="#security" onClick={(e) => { e.preventDefault(); document.getElementById(\'security\').scrollIntoView({behavior:\'smooth\'}); }}')
jsx = jsx.replace('href="#research"', 'href="#research" onClick={(e) => { e.preventDefault(); document.getElementById(\'research\').scrollIntoView({behavior:\'smooth\'}); }}')
jsx = jsx.replace('href="#vault"', 'href="#vault" onClick={(e) => { e.preventDefault(); onNavigate(\'auth\'); }}')

content = f'''import React, {{ useEffect }} from "react";

const HomePage = ({{ onNavigate }}) => {{
  useEffect(() => {{
    // Micro-interaction for table rows
    document.querySelectorAll("tbody tr").forEach(row => {{
        row.addEventListener("mouseenter", () => {{
            row.style.transform = "translateX(4px)";
            row.style.transition = "transform 0.2s ease-out";
        }});
        row.addEventListener("mouseleave", () => {{
            row.style.transform = "translateX(0)";
        }});
    }});

    // Simple smooth scroll highlight logic for active tab (simplified)
    const handleScroll = () => {{
        const sections = ["network", "security", "research"];
        const navLinks = document.querySelectorAll("nav a");
        
        let current = "";
        sections.forEach(section => {{
            const el = document.getElementById(section);
            if(el) {{
                const sectionTop = el.offsetTop;
                if (window.pageYOffset >= sectionTop - 100) {{
                    current = section;
                }}
            }}
        }});

        navLinks.forEach(link => {{
            link.classList.remove("text-primary", "font-bold");
            link.classList.add("text-on-surface-variant");
            if (link.getAttribute("href") && link.getAttribute("href").includes(current) && current !== "") {{
                link.classList.add("text-primary", "font-bold");
                link.classList.remove("text-on-surface-variant");
            }}
        }});
    }};
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }}, []);

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden">
      {{/* Inject Tailwind Config for this page */}}
      <style dangerouslySetInnerHTML={{{{__html: `
        .glass-card {{
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(108, 62, 244, 0.1);
            box-shadow: 0 20px 40px rgba(108, 62, 244, 0.04);
        }}
        .primary-gradient {{
            background: linear-gradient(135deg, #5315dc 0%, #1857c8 100%);
        }}
        .text-gradient {{
            background: linear-gradient(135deg, #5315dc 0%, #1857c8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .floating-anim {{
            animation: floating 6s ease-in-out infinite;
        }}
        @keyframes floating {{
            0% {{ transform: translateY(0px); }}
            50% {{ transform: translateY(-20px); }}
            100% {{ transform: translateY(0px); }}
        }}
        .quantum-pulse {{
            position: relative;
        }}
        .quantum-pulse::after {{
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: inherit;
            border: 2px solid #45d8f1;
            opacity: 0;
            animation: pulse-out 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }}
        @keyframes pulse-out {{
            0% {{ transform: scale(1); opacity: 0.8; }}
            100% {{ transform: scale(1.5); opacity: 0; }}
        }}
      `}}}} />
      {jsx}
    </div>
  );
}};

export default HomePage;
'''

with open('src/HomePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Converted to src/HomePage.jsx successfully')
