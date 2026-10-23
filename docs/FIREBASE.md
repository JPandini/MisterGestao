# Firebase — configuração inicial

Projeto: mistergestao-5ebe1. Integração pelo Firebase JavaScript SDK, compatível com Expo Go.

## Ambiente local

O arquivo `MisterGestao/.env` contém os seis valores públicos do projeto Firebase e fica ao lado de `package.json`, onde o Expo carrega as variáveis. Ele é ignorado pelo Git. Configure essas mesmas variáveis ao preparar outro ambiente.

## Arquivos

- MisterGestao/src/services/firebase.js: configuração pública via variáveis EXPO_PUBLIC_FIREBASE_* e instância única do app Firebase.
- MisterGestao/src/services/auth.js: autenticação na web.
- MisterGestao/src/services/auth.native.js: autenticação Android/iOS com persistência em AsyncStorage.

Para a futura integração, importe auth de src/services/auth (sem extensão). O Metro seleciona auth.native.js no celular. Não inicialize outro Auth nas telas.

A configuração cliente não é uma chave privada. As permissões do banco dependem de regras de segurança; autenticação sozinha não define quem pode acessar cada loja.

## Console — etapa manual

1. Abra https://console.firebase.google.com/project/mistergestao-5ebe1/authentication .
2. Comece a configuração de Authentication, se solicitado.
3. Em Método de login / Sign-in method, habilite E-mail/senha e salve. Login por link de e-mail não é necessário.
4. Em Usuários, adicione uma conta de teste com e-mail e senha. Não compartilhe a senha no chat nem no repositório.

Referência: https://firebase.google.com/docs/auth/web/password-auth

## Estado desta entrega

O Login usa signInWithEmailAndPassword. AuthProvider observa onAuthStateChanged e aguarda restaurar a sessão antes de montar as telas. O layout usa Stack.Protected para permitir index apenas sem sessão e home/produtos apenas com sessão. Após entrar, a navegação libera Home automaticamente; após signOut, remove as telas internas do histórico e retorna ao Login. Ao criar novas rotas internas, inclua-as no bloco protegido do layout.

O formulário valida campos vazios/e-mail, bloqueia envio duplicado e mostra carregamento e erros em português. A Home identifica a pessoa pelo displayName ou parte inicial do e-mail e oferece Sair, com tratamento de falha. A persistência no aparelho ainda precisa de teste manual. A proteção de telas não substitui regras de acesso no banco.

Próximo incremento: validar o fluxo de autenticação no aparelho. Depois, definir regras e modelo de acesso por loja antes de integrar produtos ao Firestore.

Analytics não foi inicializado: o Firebase JS SDK no React Native não oferece esse serviço. Firestore e Storage não foram integrados nesta etapa.

Referência Expo: https://docs.expo.dev/guides/using-firebase/

## Dependências e verificações — 22/10/2026

Instalados via Expo CLI: firebase 12.10.0 e @react-native-async-storage/async-storage 2.2.0. Firebase 12.10.0 foi fixado porque o Firebase 13.1.0 exige Node >=24.12.0 em seus módulos, enquanto o ambiente usa Node 24.11.1.

Verificação local de inicialização: projectId correto e reutilização da instância padrão confirmados, sem operação no banco ou criação de usuário. Lint e TypeScript passaram. Mensagens de credenciais, rede, limite de tentativas e erro desconhecido conferidas. Bundle Android exportado com sucesso (sem bytecode), após renovar o cache do Metro. Teste de login, persistência e aparelho ainda pendentes.

## Teste no aparelho

Na pasta MisterGestao (a que contém package.json), execute npx expo start --clear e abra no Expo Go. Não envie senhas para o chat.

1. Sem sessão: o app deve mostrar Login. Campos vazios/e-mail inválido devem mostrar erro sem abrir Home.
2. Tente uma senha incorreta: mostrar erro de credenciais e permitir nova tentativa.
3. Entre com a conta de teste criada no console: abrir Home e conferir o nome exibido.
4. Abra Produtos pelo atalho e volte à Home.
5. Feche e reabra o app: a sessão deve ser restaurada, sem mostrar telas internas antes dessa verificação.
6. Toque em Sair: retornar ao Login. O botão Voltar não deve reabrir Home/Produtos.
7. Sem sessão, tente abrir mistergestao://home e mistergestao://produtos em um ambiente configurado para esse scheme: permanecer no Login. No Expo Go, utilize o URL do projeto seguido de /--/home ou /--/produtos.
8. Desconecte a internet e tente entrar com a sessão encerrada: mostrar erro de conexão e permitir nova tentativa.

Configuração de E-mail/senha e criação da conta no console informadas como concluídas pelo usuário. Não houve autenticação real executada pelo agente nem alteração de produtos, estoque ou vendas no banco.
