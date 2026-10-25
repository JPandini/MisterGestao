# MisterGestão

Aplicativo Expo/React Native escrito em JavaScript. A navegação usa React Navigation; login e produtos usam Firebase Authentication e Cloud Firestore.

## Preparar o app

1. Instale as dependências: `npm install`.
2. No PowerShell, copie `.env.example` para `.env` com `Copy-Item .env.example .env` e preencha os seis valores do app Firebase em **Configurações do projeto → Seus apps**.
3. Inicie o app com `npx expo start` ou `npx expo start --web`.

O projeto local esperado no arquivo de configuração é `mistergestao-5ebe1`. Não compartilhe o `.env`. Sem esse arquivo, o app abre uma tela com os passos e os nomes das variáveis que faltam; login e Firestore só ficam disponíveis depois de configurá-lo e reiniciar o Expo.

## Configurar acesso a produtos

Os documentos ficam em `lojas/mister-motoplace/produtos`. As regras de Firestore estão em `firestore.rules`; qualquer conta autenticada no app pode consultar e cadastrar produtos.

Não é necessário cadastrar membros, perfis ou liberar cada UID no Firestore. O login no Firebase Authentication é suficiente. As regras continuam validando os dados enviados e registrando o UID de quem cadastrou o produto.

Publique as regras com `npx firebase-tools deploy --only firestore:rules` ou copie o conteúdo de `firestore.rules` em **Firebase Console → Firestore → Regras** e clique em **Publicar**. Alterar somente o arquivo local não atualiza o banco na nuvem.

## Organização

- `src/app/AppNavigator.js`: fluxo de login e pilha autenticada; cadastro de produto abre sobre as abas.
- `src/app/MainTabsNavigator.js`: barra inferior com Hoje (Home), Produtos, Orçamentos e Venda. As duas últimas abrem telas de aviso enquanto suas funcionalidades são desenvolvidas.
- `src/components/`: cabeçalho, botão e campo reutilizados.
- `src/context/`: sessão e produtos compartilhados.
- `src/services/`: Firebase, autenticação e operações de produtos.
- `src/view/`: telas do app.

Lint: `npm run lint`.
