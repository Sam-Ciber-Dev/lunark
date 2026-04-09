<?php
include('config.php'); // aqui chamas o teu ficheiro de configuração da base de dados

if(isset($_POST['email']) || isset($_POST['senha'])) { // Verifica se as variáveis 'email' e 'senha' estão definidas no array $_POST, tendo em conta que e o nome das inputbox no exemplo abaixo 

    // Verifica se o campo de email está vazio
    if(strlen($_POST['email']) == 0) { 
        echo  "Preencha seu e-mail"; 
    } else if(strlen($_POST['senha']) == 0) { 
        echo "Preencha sua senha"; 
    } else {

        $email = $mysqli->real_escape_string($_POST['email']);
        $senha = $mysqli->real_escape_string($_POST['senha']);

        $sql_code = "SELECT * FROM staff WHERE email = '$email' AND passe = '$senha'"; // iremos selecionar a tabela utilizadores e ver se no campo email e no campo senha existe o utilizador que colocamos nas inputbox

        $sql_query = $mysqli->query($sql_code) or die("Falha na execução do código SQL: " . $mysqli->error); 

        $quantidade = $sql_query->num_rows; 

        if($quantidade == 1) {// Verifica se foi retornado exatamente 1 registro

            $usuario = $sql_query->fetch_assoc(); 

            if(!isset($_SESSION)) { 
                session_start(); 
            }

            $_SESSION['id'] = $usuario['id']; 
            $_SESSION['nome'] = $usuario['nome']; 

            header("Location: admin.php"); 

        } else {
            echo "<h4>E-mail ou senha incorretos</h4>"; 
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
  
  <div class="container b-container" id="b-container">
    <form action="" method="POST" class="content-login-box">
      <h2 class="form_title title">Area do administrador</h2>
      <input type="text" class="form__input" placeholder="Email ou Telefone" name="email">
      <input type="password" class="form__input" placeholder="senha" name="senha">
      <br>
      <button type="submit" class="form__button button submit">Entrar</button>
    </form>
  </div>
  <div class="switch" id="switch-cnt">
    <div class="switch__circle"></div>
    <div class="switch__circle switch__circle--t"></div>
    <div class="switch__container" id="switch-c1">
      <h2 class="switch__title title">Bem Vindo!</h2>
      <p class="switch__description description">Para manter-se conectado conosco, faça login com suas informações pessoais</p>
      <button class="switch__button button switch-btn"><a href="registo.php" style="color:white;">Registrar</a></button>
    </div>
    
  </div>
</div>
<script src="main.js"></script>
</body>
</html>
