export function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada. Fale com o responsável pela loja.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar. Confira sua internet e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O login por e-mail e senha ainda não está habilitado no Firebase.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}
