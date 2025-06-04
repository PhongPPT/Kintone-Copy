jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID) {
  "use strict";
  let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (!CONFIG) return;
  let CONFIG_JSON = JSON.parse(CONFIG.config || "{}");
  console.log("CONFIG", CONFIG_JSON);

  // Check row function - fixed class names
  function checkRow() {
    let $rows = $("#kintoneplugin-setting-tspace > tr:not([hidden])");
    if ($rows.length <= 1) {
      $rows.find(".removeRow-main").hide();
    } else {
      $rows.find(".removeRow-main").show();
    }
  }

  // Check sub-row function
  function checkSubRow($subTable) {
    $subTable = $($subTable);
    let $subRows = $subTable.find("tbody > tr:not([hidden])");
    if ($subRows.length <= 1) {
      $subRows.find(".removeRow-sub").hide();
    } else {
      $subRows.find(".removeRow-sub").show();
    }
  }

  $(document).ready(function () {
    // Main layer: ensure at least one visible row
    let $tbody = $("#kintoneplugin-setting-tspace");
    let $templateRow = $tbody.find("tr.table-space").first();

    if ($templateRow.length && $tbody.find("tr:not([hidden])").length === 0) {
      let clonedRow = $templateRow.clone(true).removeAttr("hidden");

      // Clear main row inputs
      clonedRow.find('input[type="text"]').val("");
      clonedRow.find("select").prop("selectedIndex", 0);

      // For sub-layer: ensure at least one visible sub-row
      clonedRow.find(".sub-table").each(function () {
        let subTbody = $(this).find("tbody");
        let subTemplateRow = subTbody.find("tr").first();

        // Remove any existing visible sub-rows
        subTbody.find("tr:not(:first)").remove();

        // Create first visible sub-row from template
        if (subTemplateRow.length) {
          let subClonedRow = subTemplateRow.clone(true).removeAttr("hidden");
          subClonedRow.find('input[type="text"]').val("");
          subClonedRow.find("select").prop("selectedIndex", 0);
          subTbody.append(subClonedRow);

          // Initialize sub-row visibility
          checkSubRow(this);
        }
      });

      $tbody.append(clonedRow);
    }

    // Initial check for row visibility
    checkRow();

    // Main layer add row
    $tbody.on("click", ".addRow-main", function () {
      let closestTbody = $(this).closest("tbody");
      let templateRow = closestTbody.find("tr.table-space").first();
      let clonedRow = templateRow.clone(true).removeAttr("hidden");

      // Clear main row inputs
      clonedRow.find('input[type="text"]').val("");
      clonedRow.find("select").prop("selectedIndex", 0);

      // For sub-layer: reset to have only one visible row
      clonedRow.find(".sub-table").each(function () {
        let subTbody = $(this).find("tbody");
        let subTemplateRow = subTbody.find("tr").first();

        // Remove all rows except template
        subTbody.find("tr:not(:first)").remove();

        // Create one visible sub-row
        if (subTemplateRow.length) {
          let subClonedRow = subTemplateRow.clone(true).removeAttr("hidden");
          subClonedRow.find('input[type="text"]').val("");
          subClonedRow.find("select").prop("selectedIndex", 0);
          subTbody.append(subClonedRow);

          // Initialize sub-row visibility
          checkSubRow(this);
        }
      });

      $(this).closest("tr").after(clonedRow);
      checkRow();
    });

    // Main layer remove row
    $tbody.on("click", ".removeRow-main", function () {
      let closestTbody = $(this).closest("tbody");
      if (closestTbody.find("tr:not([hidden])").length > 1) {
        $(this).closest("tr").remove();
        checkRow();
      }
    });

    // Sub-layer add row
    $tbody.on("click", ".addRow-sub", function () {
      let subTable = $(this).closest(".sub-table");
      let subTbody = subTable.find("tbody");
      let subTemplateRow = subTbody.find("tr").first();
      let subClonedRow = subTemplateRow.clone(true).removeAttr("hidden");

      subClonedRow.find('input[type="text"]').val("");
      subClonedRow.find("select").prop("selectedIndex", 0);
      $(this).closest("tr").after(subClonedRow);

      checkSubRow(subTable);
    });

    // Sub-layer remove row
    $tbody.on("click", ".removeRow-sub", function () {
      let subTable = $(this).closest(".sub-table");
      let subTbody = subTable.find("tbody");

      if (subTbody.find("tr:not([hidden])").length > 1) {
        $(this).closest("tr").remove();
        checkSubRow(subTable);
      }
    });
  });

  let GETFIELD = await kintone.api("/k/v1/preview/app/form/fields", "GET", {
    app: kintone.app.getId(),
  });
  console.log("GETFIELD", GETFIELD);
  let fieldsCode = [
    "FILE",
    "DATE",
    "MULTI_LINE_TEXT",
    "DROP_DOWN",
    "RADIO_BUTTON",
    "SINGLE_LINE_TEXT",
  ];

  let select = $(".type-select-field-A");
  select.empty();
  select.append('<option value="-----">-----</option>');

  Object.keys(GETFIELD.properties).forEach((code) => {
    const field = GETFIELD.properties[code];

    if (fieldsCode.includes(field.type)) {
      select.append(
        `<option value="${field.code}"  data-type="${field.type}">${field.label}</option>`
      );
    }
  });

  // Utility function to populate select-field-B
  async function populateSelectFieldB(subRow) {
    let AppID = subRow.find(".appID").val();
    let selectedOptionA = subRow.find(".type-select-field-A option:selected");
    let selectedText = selectedOptionA.text();
    let selectedType = selectedOptionA.data("type");
    let selectB = subRow.find(".type-select-field-B");

    // Guard: If no AppID or invalid selection
    if (!AppID || !selectedType || selectedText === "-----") {
      selectB.empty();
      selectB.append('<option value="-----">-----</option>');
      return;
    }

    selectB.empty();
    selectB.append('<option value="-----">-----</option>');

    try {
      let GETFIELD = await kintone.api("/k/v1/preview/app/form/fields", "GET", {
        app: AppID,
      });

      Object.keys(GETFIELD.properties).forEach((code) => {
        let field = GETFIELD.properties[code];
        if (field.type === selectedType) {
          selectB.append(
            `<option value="${field.code}" data-type="${field.type}">${field.label}</option>`
          );
        }
      });
    } catch (error) {
      console.error("Failed to fetch app fields:", error);
    }
  }

  // Trigger when appID is changed
  $("#kintoneplugin-setting-tspace").on(
    "change",
    ".sub-table .appID",
    function () {
      let subRow = $(this).closest("tr");
      populateSelectFieldB(subRow);
    }
  );

  // Trigger when field A is changed
  $("#kintoneplugin-setting-tspace").on(
    "change",
    ".sub-table .type-select-field-A",
    function () {
      let subRow = $(this).closest("tr");
      populateSelectFieldB(subRow);
    }
  );

  function getPluginConfig() {
    const config = { table: [] };
    const mainRows = document.querySelectorAll(
      "#kintoneplugin-setting-tspace > tr:not([hidden])"
    );

    mainRows.forEach((mainRow) => {
      const subRows = mainRow.querySelectorAll(".sub-table tr:not([hidden])");
      const subTable = [];

      subRows.forEach((subRow) => {
        const buttonName = subRow.querySelector(".ButtonName")?.value || "";
        const appID = subRow.querySelector(".appID")?.value || "";
        const fieldA =
          subRow.querySelector(".type-select-field-A")?.value || "";
        const fieldB =
          subRow.querySelector(".type-select-field-B")?.value || "";
        const condition =
          subRow.querySelector(".store-field-select-condition")?.value || "";

        subTable.push({
          buttonName,
          appID,
          fieldA,
          fieldB,
          condition,
        });
      });

      config.table.push({ subTable });
    });

    return config;
  }

  //setConfig
  async function setConfig(CONFIG_JSON) {
    // Get the main table space
    const tspace = document.getElementById("kintoneplugin-setting-tspace");

    // Validate template row
    const mainRowTemplate = tspace.querySelector("tr.table-space[hidden]");
    if (!mainRowTemplate) {
      console.error("Main row template not found.");
      return;
    }

    // Clear existing rows before adding new ones
    tspace.querySelectorAll("tr:not([hidden])").forEach((row) => row.remove());

    for (const mainTableItem of CONFIG_JSON.table) {
      const mainRow = mainRowTemplate.cloneNode(true);
      mainRow.hidden = false;

      // Get the sub-table body and template row
      const subTableBody = mainRow.querySelector(".sub-table tbody");
      const subRowTemplate = subTableBody.querySelector(
        "tr.table-space[hidden]"
      );
      if (!subRowTemplate) {
        console.error("Sub-row template not found.");
        continue;
      }

      for (const subItem of mainTableItem.subTable) {
        const subRow = subRowTemplate.cloneNode(true);
        subRow.hidden = false;

        subRow.querySelector(".ButtonName").value = subItem.buttonName || "";
        subRow.querySelector(".appID").value = subItem.appID || "";

        subRow.querySelector(".type-select-field-A").value =
          subItem.fieldA || "-----";

        try {
          await populateSelectFieldB($(subRow));
          subRow.querySelector(".type-select-field-B").value =
            subItem.fieldB || "-----";
        } catch (error) {
          console.error("Error populating Field B:", error);
        }

        subRow.querySelector(".store-field-select-condition").value =
          subItem.condition || "-----";

        subTableBody.appendChild(subRow);
      }

      tspace.appendChild(mainRow);
    }

    checkRow();
    $("#kintoneplugin-setting-tspace .sub-table").each(function () {
      checkSubRow($(this));
    });
  }

  await setConfig(CONFIG_JSON);

  // Save plugin config when clicking the save button
  $("#button_save").on("click", async function () {
    const configObj = getPluginConfig();
    console.log("configObj", configObj);

    let config = JSON.stringify(configObj);
    console.log("config", config);

    // Uncomment and use this to save the configuration to kintone
    kintone.plugin.app.setConfig({ config }, () => {
      console.log("Config saved successfully!");
      window.location.href = `../../flow?app=${kintone.app.getId()}#section=settings`;
    });
  });

  $("#cancel").on("click", function () {
    window.location.href = `../../flow?app=${kintone.app.getId()}#section=settings`;
  });

  //   window.RsComAPI.hideSpinner();
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);
