(function ($, PLUGIN_ID) {
  "use strict";

  const events = [
    "app.record.create.show",
    "app.record.edit.show",
    "app.record.detail.show",
    "app.record.detail.process.proceed",
  ];

  kintone.events.on(events, async function (event) {
    const record = event.record;
    console.log("object record", record);
    const buttonCopy = kintone.app.record.getSpaceElement("copy_detail_app");
    const status =
      (record.Status && record.Status.value) ||
      (record.__STATUS__ && record.__STATUS__.value) ||
      null;
    console.log("status record", status);
    let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!CONFIG) return;
    let CONFIG_JSON = JSON.parse(CONFIG.config || "{}");
    console.log("CONFIG", CONFIG_JSON);

    // if (status === "完了") {
    $.each(CONFIG_JSON.table, function (i, tableItem) {
      $.each(tableItem.subTable, function (j, subItem) {
        let AppID = subItem.appID || "";
        let ButtonName = subItem.buttonName || "";
        let FieldA = subItem.fieldA || "";
        let FieldB = subItem.fieldB || "";
        console.log("FieldB:", FieldB);

        const fieldAValue = record[FieldA] ? record[FieldA].value : "";
        console.log("fieldAValue:", fieldAValue);

        if (buttonCopy) {
          const button = $("<button>", {
            text: `${ButtonName}`,
            class: "kintoneplugin-button-dialog-ok",
          });
          $(buttonCopy).append(button);
          $(button).on("click", async () => {
            console.log("test copy data 911");

            try {
              let GETFIELD = await kintone.api(
                "/k/v1/preview/app/form/fields",
                "GET",
                {
                  app: AppID,
                }
              );

              console.log("Get fields: ", GETFIELD);
              Object.keys(GETFIELD.properties).forEach(async (code) => {
                let field = GETFIELD.properties[code];
                console.log("field", field);
                if (field.code === FieldB) {
                  console.log("test phong 911");
                  const response = await kintone.api(
                    kintone.api.url("/k/v1/record", true),
                    "POST",
                    {
                      app: AppID,
                      record: {
                        [FieldB]: {
                          value: fieldAValue,
                        },
                      },
                    }
                  );
                  console.log("New record created successfully:", response);
                  alert("Data copied successfully to App ID " + AppID);
                }
              });
            } catch (error) {
              console.error("Error during record check or creation:", error);
            }
          });
        }
      });
    });
    // }
    return event;
  });
})(jQuery, kintone.$PLUGIN_ID);
