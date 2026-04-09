<?php
include('config.php');

if(isset($_POST['login_email']) && isset($_POST['login_senha'])) {
    
} elseif(isset($_POST['registro_nome']) && isset($_POST['registro_email']) && isset($_POST['registro_senha'])) {
    $nome = $mysqli->real_escape_string($_POST['registro_nome']);
    $email = $mysqli->real_escape_string($_POST['registro_email']);
    $senha = $mysqli->real_escape_string($_POST['registro_senha']);

    // Verifica se o e-mail já está em uso
    $check_email_query = "SELECT * FROM users WHERE email = '$email'";
    $check_email_result = $mysqli->query($check_email_query);
    if($check_email_result->num_rows > 0) {
        echo "Este e-mail já está em uso.";
    } else {
        // Insere o novo usuário no banco de dados
        $insert_user_query = "INSERT INTO users (nome, email, senha) VALUES ('$nome', '$email', '$senha')";
        if($mysqli->query($insert_user_query) === TRUE) {
            // Alerta de usuário registrado com sucesso
            echo "<script>alert('Utilizador Registado!');</script>";
        } else {
            // Alerta de erro ao registrar o usuário
            echo "<script>alert('Erro ao registrar o usuário: " . $mysqli->error . "');</script>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es" dir="ltr">
  <head>
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0">
    <meta charset="utf-8">
    <link rel="stylesheet" href="stylelog.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div class="main">
      <div class="container a-container" id="a-container">
        <form action="" method="POST" class="content-login-box">
            <h2 class="form_title title">Registrar</h2>
            <input type="text" class="form__input" placeholder="Nome" name="registro_nome">
            <input type="text" class="form__input" placeholder="Email" name="registro_email">
            <input type="password" class="form__input" placeholder="Senha" name="registro_senha">
            <br>
            <button type="submit" class="form__button button submit" herf="login.php">Registrar</button>
        </form>
      </div>
      
      <div class="switch" id="switch-cnt">
        <div class="switch__circle"></div>
        <div class="switch__circle switch__circle--t"></div>
        <div class="switch__container" id="switch-c1">
          <h2 class="switch__title title">Bem Vindo</h2>
          <p class="switch__description description">To keep connected with us please login with your personal info</p>
          <button class="switch__button button switch-btn" herf="login.php"><a href="login.php" style="color:white;">Entrar</button>
        </div>
      </div>
    </div>
    <script src="main.js"></script>
  </body>
</html>
