import { MODULE_ID, MODULE_NAME } from "./const.js";

Hooks.on("renderDrawingHUD", (hud, root) => {
    // Handle both v12 (jQuery) and v13 (HTMLElement) 
    const element = root?.jquery ? root[0] : (root instanceof HTMLElement ? root : hud?.element);
    if (!element) return;

    const leftCol = element.querySelector(".col.left");
    if (!leftCol) return;

    const edit = document.createElement("div");
    edit.classList.add("control-icon");

    if (hud.object._editMode) {
        edit.classList.add("active");
    }

    edit.setAttribute("title", "편집");
    edit.dataset.action = `${MODULE_ID}.edit`;
    edit.innerHTML = `<i class="fas fa-draw-polygon"></i>`;

    leftCol.appendChild(edit);
    
    // Add click handler for edit button
    const editButton = element.querySelector(`.control-icon[data-action="${MODULE_ID}.edit"]`);
    if (editButton) {
        editButton.addEventListener("click", async (event) => {
            await unlockDrawing(hud);

            const drawing = hud.object;

            if (drawing.document.locked) {
                return;
            }

            await drawing._convertToPolygon({ confirm: true });

            if (drawing.document.shape.type === "p") {
                drawing._toggleEditMode();
                hud.render(true);
            }
        });
    }

    if (hud.object.document.shape.type === "p") {
        const flipH = document.createElement("div");

        flipH.classList.add("control-icon");
        flipH.setAttribute("title", "좌우 반전");
        flipH.dataset.action = `${MODULE_ID}.flip-h`;
        flipH.innerHTML = `<i class="fas fa-arrows-alt-h"></i>`;

        leftCol.appendChild(flipH);
        
        // Add click handler for flip horizontal button
        const flipHButton = element.querySelector(`.control-icon[data-action="${MODULE_ID}.flip-h"]`);
        if (flipHButton) {
            flipHButton.addEventListener("click", async (event) => {
                await unlockDrawing(hud);

                if (hud.object.document.locked) {
                    return;
                }

                const document = hud.object.document;
                const width = Math.abs(document.shape.width);
                const points = foundry.utils.deepClone(document.shape.points);

                for (let i = 0; i < points.length; i += 2) {
                    points[i] = width - points[i];
                }

                await document.update({ shape: { points } });
            });
        }

        const flipV = document.createElement("div");

        flipV.classList.add("control-icon");
        flipV.setAttribute("title", "상하 반전");
        flipV.dataset.action = `${MODULE_ID}.flip-v`;
        flipV.innerHTML = `<i class="fas fa-arrows-alt-v"></i>`;

        leftCol.appendChild(flipV);
        
        // Add click handler for flip vertical button
        const flipVButton = element.querySelector(`.control-icon[data-action="${MODULE_ID}.flip-v"]`);
        if (flipVButton) {
            flipVButton.addEventListener("click", async (event) => {
                await unlockDrawing(hud);

                if (hud.object.document.locked) {
                    return;
                }

                const document = hud.object.document;
                const height = Math.abs(document.shape.height);
                const points = foundry.utils.deepClone(document.shape.points);

                for (let i = 1; i < points.length; i += 2) {
                    points[i] = height - points[i];
                }

                await document.update({ shape: { points } });
            });
        }
    }
});

async function unlockDrawing(hud) {
    return await new Promise(resolve => {
        if (hud.object.document.locked) {
            foundry.applications.api.DialogV2.confirm({
                window: { title: `${MODULE_NAME}: 그리기 잠금 해제` },
                content: `<p>이 그리기의 잠금을 해제할까요?</p>`,
                rejectClose: false,
                modal: true
            }).then(result => resolve(result));
        } else {
            resolve(false);
        }
    }).then(async result => {
        if (!result) {
            return;
        }

        await hud.object.document.update({ locked: false });
        hud.render(true);
    });
}
