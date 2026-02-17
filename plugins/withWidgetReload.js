const { withAppDelegate } = require("@expo/config-plugins");

/**
 * Expo config plugin that adds WidgetCenter.shared.reloadAllTimelines()
 * to AppDelegate's applicationDidBecomeActive, so the iOS widget
 * refreshes whenever the app returns to the foreground.
 */
const withWidgetReload = (config) => {
  return withAppDelegate(config, (config) => {
    const { contents, language } = config.modResults;

    if (language !== "swift") {
      throw new Error("withWidgetReload only supports Swift AppDelegate");
    }

    let newContents = contents;

    // Add WidgetKit import if not present
    if (!newContents.includes("import WidgetKit")) {
      newContents = newContents.replace(
        /^(import\s+\w+)/m,
        "import WidgetKit\n$1"
      );
    }

    // Add applicationDidBecomeActive if not present
    if (!newContents.includes("applicationDidBecomeActive")) {
      // Insert before the closing brace of the AppDelegate class.
      // Find the Linking API method or the last override method to insert before it.
      const insertionPoint = newContents.indexOf(
        "  // Linking API"
      );

      if (insertionPoint !== -1) {
        const snippet = [
          "  // Reload widgets whenever the app comes to foreground",
          "  public override func applicationDidBecomeActive(_ application: UIApplication) {",
          "    super.applicationDidBecomeActive(application)",
          "    WidgetCenter.shared.reloadAllTimelines()",
          "  }",
          "",
          "",
        ].join("\n");

        newContents =
          newContents.slice(0, insertionPoint) +
          snippet +
          newContents.slice(insertionPoint);
      } else {
        // Fallback: insert before the last closing brace of the AppDelegate class
        // Find "class ReactNativeDelegate" and insert before it
        const fallbackPoint = newContents.indexOf("class ReactNativeDelegate");
        if (fallbackPoint !== -1) {
          const snippet = [
            "",
            "  // Reload widgets whenever the app comes to foreground",
            "  public override func applicationDidBecomeActive(_ application: UIApplication) {",
            "    super.applicationDidBecomeActive(application)",
            "    WidgetCenter.shared.reloadAllTimelines()",
            "  }",
            "",
          ].join("\n");

          // Find the closing brace of AppDelegate class (the "}" before ReactNativeDelegate)
          const lastBrace = newContents.lastIndexOf("}", fallbackPoint);
          if (lastBrace !== -1) {
            newContents =
              newContents.slice(0, lastBrace) +
              snippet +
              "\n" +
              newContents.slice(lastBrace);
          }
        }
      }
    }

    config.modResults.contents = newContents;
    return config;
  });
};

module.exports = withWidgetReload;
