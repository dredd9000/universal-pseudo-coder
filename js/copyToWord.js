document
  .getElementById("copy-indents-btn")
  .addEventListener("click", async function () {
    const btn = this;
    const plainTextCode = monaco.editor.getModels()[0].getValue();

    // The Trick: Replace every space with a non-breaking space (&nbsp;)
    // and every newline with a <br> to force Word to respect the layout.
    const hardcodedHtml = plainTextCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/ /g, "&nbsp;")
      .replace(/\n/g, "<br>");

    const finalHtml = `
        <div style="font-family: 'Courier New', monospace; font-size: 11pt; line-height: 1.2; color: #000000;">
            ${hardcodedHtml}
        </div>
    `;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([finalHtml], { type: "text/html" }),
          "text/plain": new Blob([plainTextCode], { type: "text/plain" }),
        }),
      ]);
      btn.textContent = "✅ Copied!";
      btn.classList.add("success");
      setTimeout(() => {
        btn.textContent = "✨ Copy Indents Only";
        btn.classList.remove("success");
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  });
