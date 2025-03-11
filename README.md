RACELINK
===

dev env vars
```
# cant use string 'localhost' on windows for some reason.
export VOCALIZER_URL='http://127.0.0.1:8647'
export RACER_URL='http://127.0.0.1:3000/api'
```

dev setup
```
cd .\Desktop\beam-bird\gh_repos\racelink\
yarn install
npm run dev
```

releasing

linux shell
```
# update version in package.json - should track same minor version of the aipacenotes mod.
git tag "$(jq -r '.version' package.json )"
git push
git push --tag

(in powershell)
npm run build

export BIRD="/c/Users/bird/beamng/"
VER="$(jq -r '.version[1:] ' package.json)" ; cp -v "release/${VER}/RaceLink-${VER}-Setup.exe" "${BIRD}/build/" ; ls -ltrh "${BIRD}/build/"
explorer.exe $(wslpath -w "${BIRD}/build/")
```

changelog
```
git --no-pager log $(git describe --tags --abbrev=0 $(git describe --tags --abbrev=0)^)..HEAD --pretty=format:"* %s" ; echo
```

windows shell (dont need to use an admin shell)
```
npm run build
# then find the exe file
```

# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.
