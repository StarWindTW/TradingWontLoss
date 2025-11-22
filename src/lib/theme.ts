import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customThemeConfig = defineConfig({
    theme: {
        tokens: {
            colors: {
                brand: {
                    50: { value: "#e3f2ff" },
                    100: { value: "#b3daff" },
                    200: { value: "#81c1ff" },
                },
            },
        },
        semanticTokens: {
            colors: {
                dcms: {
                    bg: {
                        value: {
                            _light: "white",
                            _dark: "colors.gray.900",
                        }
                    },
                    panel: {
                        value: {
                            _light: "white",
                            _dark: "colors.gray.800",
                        }
                    },
                }
            }
        }
    }
});


export const system = createSystem(defaultConfig, customThemeConfig);