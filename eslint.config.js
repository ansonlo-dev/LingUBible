import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // 不使用默認的 react-hooks 規則，手動控制
      "react-refresh/only-export-components": "off", // 關閉組件導出檢查
      // 關閉所有可能產生警告的規則
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off", // 允許 any 類型
      "@typescript-eslint/no-empty-object-type": "off", // 允許空對象類型
      "@typescript-eslint/no-require-imports": "off", // 允許 require 導入
      "react-hooks/exhaustive-deps": "off", // 關閉依賴檢查
      "no-useless-escape": "off", // 允許轉義字符
      "no-case-declarations": "off", // 允許 case 塊中的聲明
      "no-empty": "off", // 允許空塊
      "no-useless-catch": "off", // 允許看似無用的 try/catch
      "prefer-const": "off", // 關閉 const 偏好
      "no-var": "off", // 允許 var 使用
      "no-cond-assign": "off", // 允許條件賦值
      "no-dupe-else-if": "off", // 允許重複條件
      "react-hooks/rules-of-hooks": "off", // 關閉 React Hooks 規則檢查
      "@typescript-eslint/no-unused-expressions": "off", // 允許未使用的表達式
      "@typescript-eslint/no-this-alias": "off", // 允許 this 別名
      "no-unsafe-finally": "off", // 允許 finally 中的控制流語句
      "no-prototype-builtins": "off", // 允許直接調用 Object.prototype 方法
      "no-fallthrough": "off", // 允許 switch case 穿透
      "no-irregular-whitespace": "off", // 允許不規則空白字符
      "no-control-regex": "off", // 允許控制字符正則表達式
      "no-misleading-character-class": "off", // 允許誤導性字符類
      "no-async-promise-executor": "off", // 允許異步 Promise 執行器
      "no-constant-condition": "off", // 允許常量條件
    },
  }
);
