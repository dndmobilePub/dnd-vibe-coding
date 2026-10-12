// Native Figma development plugin. Generated code.js embeds the token manifest.
const tokens = /* TOKEN_DATA */;

async function main() {
  if (figma.root.children.some(page => page.name === "MnM · Components")) {
    figma.notify("MnM 라이브러리가 이미 있습니다. 중복 생성을 중단했습니다.");
    return;
  }
  const fonts = await figma.listAvailableFontsAsync();
  const family = fonts.some(item => item.fontName.family === "Noto Sans KR") ? "Noto Sans KR" : "Inter";
  const regular = fonts.find(item => item.fontName.family === family && item.fontName.style === "Regular")?.fontName;
  const semibold = fonts.find(item => item.fontName.family === family && /Semi ?Bold/.test(item.fontName.style))?.fontName || regular;
  if (!regular) throw new Error("Noto Sans KR 또는 Inter 폰트가 필요합니다.");
  await Promise.all([figma.loadFontAsync(regular), figma.loadFontAsync(semibold)]);
  const rgb = hex => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 });
  const resolve = key => tokens.aliases[key] ? resolve(tokens.aliases[key]) : tokens.colors[key] ?? tokens.numbers[key];
  const collections = {};
  for (const name of ["MnM / Primitives", "MnM / Semantic", "MnM / Component"]) {
    const collection = figma.variables.createVariableCollection(name);
    collection.renameMode(collection.defaultModeId, "Light");
    collections[name] = collection;
  }
  const variables = {};
  const scopes = key => typeof resolve(key) === "string" ? ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"] :
    key.includes("radius") ? ["CORNER_RADIUS"] : key.includes("font-size") ? ["FONT_SIZE"] :
    key.startsWith("space-") ? ["GAP"] : ["WIDTH_HEIGHT"];
  function variable(key, value, collection, alias) {
    const node = figma.variables.createVariable(key.replaceAll("-", "/"), collection, typeof resolve(key) === "string" ? "COLOR" : "FLOAT");
    node.scopes = alias ? scopes(key) : [];
    node.setVariableCodeSyntax("WEB", `var(--${key})`);
    node.setValueForMode(collection.defaultModeId, alias ? { type: "VARIABLE_ALIAS", id: variables[value].id } : typeof value === "string" ? rgb(value) : value);
    variables[key] = node;
  }
  for (const [key, value] of Object.entries({ ...tokens.colors, ...tokens.numbers })) variable(key, value, collections["MnM / Primitives"], false);
  for (const [key, value] of Object.entries(tokens.aliases)) variable(key, value, collections[/^(button|checkbox|input|icon)-/.test(key) ? "MnM / Component" : "MnM / Semantic"], true);
  // Expose spacing, radius and typography via semantic aliases as well.
  for (const key of Object.keys(tokens.numbers)) {
    const node = figma.variables.createVariable(key.replaceAll("-", "/"), collections["MnM / Semantic"], "FLOAT");
    node.scopes = scopes(key);
    node.setVariableCodeSyntax("WEB", `var(--${key})`);
    node.setValueForMode(collections["MnM / Semantic"].defaultModeId, { type: "VARIABLE_ALIAS", id: variables[key].id });
    variables[key] = node;
  }
  function paint(key) {
    return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: rgb(resolve(key)) }, "color", variables[key]);
  }
  const textStyles = {};
  for (const [name, size, bold, line] of [["Caption", 13, false, 20], ["Body", 14, false, 22], ["Base", 15, false, 24], ["Button", 13, true, 20], ["Heading", 24, true, 34]]) {
    const style = figma.createTextStyle();
    style.name = `MnM / ${name}`;
    style.fontName = bold ? semibold : regular;
    style.fontSize = size;
    style.lineHeight = { unit: "PIXELS", value: line };
    style.letterSpacing = { unit: "PIXELS", value: -.3 };
    textStyles[name] = style;
  }
  const shadow = figma.createEffectStyle();
  shadow.name = "MnM / Card";
  shadow.effects = [{ type: "DROP_SHADOW", color: { ...rgb("#18395a"), a: 10 / 255 }, offset: { x: 0, y: 6 }, radius: 24, spread: 0, visible: true, blendMode: "NORMAL" }];
  const foundation = figma.createPage();
  foundation.name = "MnM · Foundations";
  await figma.setCurrentPageAsync(foundation);
  function frame(name, direction = "VERTICAL") {
    const node = figma.createFrame();
    node.name = name; node.layoutMode = direction; node.itemSpacing = 16;
    node.primaryAxisSizingMode = "AUTO"; node.counterAxisSizingMode = "AUTO";
    node.fills = []; return node;
  }
  async function text(value, style = "Body", color = "ink") {
    const node = figma.createText();
    await node.setTextStyleIdAsync(textStyles[style].id);
    node.characters = value; node.fills = [paint(color)]; return node;
  }
  const specimen = frame("Foundations");
  specimen.x = 80; specimen.y = 80; specimen.paddingTop = specimen.paddingBottom = specimen.paddingLeft = specimen.paddingRight = 32;
  specimen.fills = [paint("surface")]; foundation.appendChild(specimen);
  specimen.appendChild(await text("MnM Insight · Design System", "Heading"));
  specimen.appendChild(await text(`Light · ${family} · source: design-system/tokens.json`));
  if (family !== "Noto Sans KR") specimen.appendChild(await text("폰트 대체: Noto Sans KR 미설치로 Inter 사용. 원본 폰트 설치 후 변경하세요."));
  for (const key of ["bg", "surface", "ink", "muted", "blue", "selected", "line", "color-danger"]) {
    const row = frame(key, "HORIZONTAL");
    const swatch = figma.createRectangle(); swatch.resize(44, 44); swatch.fills = [paint(key)]; swatch.strokes = [paint("line")]; row.appendChild(swatch);
    row.appendChild(await text(`${key}  ${resolve(key)}`)); specimen.appendChild(row);
  }
  specimen.appendChild(await text("Spacing: 4 / 8 / 12 / 16 / 24 / 32 px"));
  specimen.appendChild(await text("Radius: 6 / 8 / 14 px · Control: 44 px · Checkbox: 22 px"));
  for (const name of Object.keys(textStyles)) specimen.appendChild(await text(`${name} · 데이터에서 인사이트까지`, name));
  const page = figma.createPage(); page.name = "MnM · Components";
  await figma.setCurrentPageAsync(page);
  const showcase = frame("Component review · instances");
  showcase.x = 80; showcase.y = 80; showcase.paddingTop = showcase.paddingBottom = showcase.paddingLeft = showcase.paddingRight = 32;
  showcase.fills = [paint("surface")]; page.appendChild(showcase);
  showcase.appendChild(await text("Common Components", "Heading"));
  const plusIcon = figma.createComponent();
  plusIcon.name = "Icon / Plus"; plusIcon.resize(16, 16); plusIcon.fills = [];
  plusIcon.description = "기본 추가 아이콘. IconButton의 Icon 속성으로 다른 아이콘 컴포넌트를 교체할 수 있습니다.";
  const plusVector = figma.createNodeFromSvg('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="#8c99a5" stroke-width="2" stroke-linecap="round"/></svg>');
  plusIcon.appendChild(plusVector); plusIcon.x = 1500; plusIcon.y = -60;
  for (const vector of plusVector.findAll(node => node.type === "VECTOR")) vector.strokes = [paint("icon-color")];
  const families = ["Button", "IconButton", "Checkbox", "Select", "Input", "Textarea"];
  let setY = 80; const created = [];
  for (const familyName of families) {
    const isField = ["Select", "Input", "Textarea"].includes(familyName);
    const states = isField ? ["Default", "Hover", "Focus", "Disabled", "Invalid"] : ["Default", "Hover", "Focus", "Disabled"];
    const kinds = familyName === "Button" ? ["Primary", "Secondary"] : familyName === "Checkbox" ? ["Unchecked", "Checked", "Indeterminate"] : ["Default"];
    const components = [];
    const group = frame(familyName); group.appendChild(await text(familyName, "Base")); showcase.appendChild(group);
    for (const kind of kinds) {
      const row = frame(kind, "HORIZONTAL"); group.appendChild(row);
      for (const state of states) {
        const c = figma.createComponent();
        c.name = `${familyName === "Checkbox" ? "Checked" : "Variant"}=${kind}, State=${state}`;
        c.layoutMode = "HORIZONTAL"; c.primaryAxisAlignItems = "CENTER"; c.counterAxisAlignItems = "CENTER"; c.itemSpacing = 8;
        c.setBoundVariable("itemSpacing", variables["space-2"]);
        c.resize(familyName === "Checkbox" ? 22 : familyName === "IconButton" ? 44 : isField ? 220 : 112, familyName === "Checkbox" ? 22 : familyName === "Textarea" ? 95 : familyName === "Button" ? 46 : 44);
        c.cornerRadius = familyName === "Checkbox" || familyName === "IconButton" ? 6 : 8;
        c.setBoundVariable("cornerRadius", variables[familyName === "Checkbox" ? "checkbox-radius" : familyName === "IconButton" ? "radius-sm" : "control-radius"]);
        let background = "surface", foreground = "ink", border = "line";
        if (familyName === "Button") {
          background = kind === "Primary" ? state === "Hover" ? "button-primary-hover" : "button-primary-bg" : state === "Hover" ? "button-secondary-hover" : "button-secondary-bg";
          foreground = kind === "Primary" ? "button-primary-text" : "button-secondary-text";
          border = kind === "Primary" ? "blue" : "button-secondary-border";
        } else if (familyName === "Checkbox") {
          background = kind === "Unchecked" ? state === "Hover" ? "checkbox-hover" : "checkbox-bg" : state === "Hover" ? "button-primary-hover" : "checkbox-selected";
          foreground = "surface"; border = kind === "Unchecked" ? state === "Hover" ? "blue" : "checkbox-border" : background;
          c.strokeWeight = 1.5;
        } else if (familyName === "IconButton") {
          background = state === "Hover" ? "icon-hover" : "surface"; foreground = "icon-color";
        } else {
          border = state === "Invalid" ? "color-danger" : state === "Hover" && familyName === "Select" ? "muted" : familyName === "Select" ? "line" : "input-border";
          if (state === "Disabled") { background = "bg"; foreground = "muted"; }
        }
        c.fills = familyName === "IconButton" && state !== "Hover" ? [] : [paint(background)];
        c.strokes = familyName === "IconButton" ? [] : [paint(border)];
        if (state === "Focus") c.effects = [{ type: "DROP_SHADOW", color: { ...rgb(resolve("focus")), a: .55 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: "NORMAL" }];
        if (state === "Disabled") c.opacity = isField ? .65 : .45;
        if (familyName === "IconButton") {
          const icon = plusIcon.createInstance(); c.appendChild(icon);
          const property = c.addComponentProperty("Icon", "INSTANCE_SWAP", plusIcon.id);
          icon.componentPropertyReferences = { mainComponent: property };
        } else if (familyName === "Checkbox" && kind !== "Unchecked") {
          const path = kind === "Checked" ? "m5 12 4 4L19 6" : "M5 12h14";
          const icon = figma.createNodeFromSvg(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="${resolve(foreground)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
          icon.name = "Icon"; c.appendChild(icon);
          for (const vector of icon.findAll(node => node.type === "VECTOR")) vector.strokes = [paint(foreground)];
        } else if (familyName !== "Checkbox") {
          const label = await text(familyName === "Button" ? "버튼" : familyName === "Textarea" ? "분석 목적을 입력하세요" : familyName === "Select" ? "선택하세요" : "값을 입력하세요", familyName === "Button" ? "Button" : "Body", foreground);
          label.name = "Label"; c.appendChild(label);
          const property = c.addComponentProperty("Label", "TEXT", label.characters); label.componentPropertyReferences = { characters: property };
          if (isField) {
            c.primaryAxisAlignItems = "MIN"; c.paddingLeft = 14; c.paddingRight = 14;
            c.setBoundVariable("paddingLeft", variables["space-4"]); c.setBoundVariable("paddingRight", variables["space-4"]);
            if (familyName === "Textarea") { c.counterAxisAlignItems = "MIN"; c.paddingTop = 12; c.setBoundVariable("paddingTop", variables["space-3"]); }
            if (familyName === "Select") {
              label.layoutSizingHorizontal = "FILL";
              const arrow = figma.createNodeFromSvg(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m6 9 6 6 6-6" stroke="${resolve("muted")}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`); c.appendChild(arrow);
            }
          }
        }
        c.description = `${familyName}: app/components/ui. ${state} state. Provide accessible label in code.`;
        components.push(c);
        const cell = frame(`${kind} / ${state}`); cell.appendChild(await text(state, "Caption", "muted")); cell.appendChild(c.createInstance()); row.appendChild(cell);
      }
    }
    const set = figma.combineAsVariants(components, page); set.name = familyName;
    set.description = `${familyName} · React export: @/app/components/ui. ${states.join(", ")}.`;
    set.x = 1500; set.y = setY;
    set.layoutMode = "NONE";
    components.forEach((c, index) => { c.x = 24 + index % states.length * 250; c.y = 24 + Math.floor(index / states.length) * 125; });
    set.resize(states.length * 250 + 48, kinds.length * 125 + 48); setY += set.height + 60;
    created.push({ name: familyName, id: set.id, variants: components.length });
  }
  figma.viewport.scrollAndZoomIntoView([showcase]);
  console.log(JSON.stringify({ collections: Object.values(collections).map(c => c.id), components: created, review: showcase.id, foundations: specimen.id, font: family }));
  figma.notify("공통 컴포넌트 6종과 토큰·타이포 라이브러리를 생성했습니다.");
}

main().then(() => figma.closePlugin()).catch(error => { figma.notify(String(error), { error: true }); figma.closePlugin(); });
