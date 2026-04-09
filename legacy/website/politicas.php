<!DOCTYPE html>
<html>

<!-- head section -->
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DropBox</title>
    <link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" />
    <link rel="stylesheet" href="style.css">
</head>
<!-- end of head section -->

<!-- body section -->
<body>

     <!-- header section -->
<section id="header">
    <a href="index.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a>
    
    <div>
        <ul id="navbar">
            <li><a href="index.php">Home</a></li>
            <li><a href="shop.php">Shop</a></li>
            <li><a class="active" href="about.php">About</a></li>
            <li><a href="contact.php">Contact</a></li>
            <li id="lg-bag"><a href="cart.php"><i class="fas fa-shopping-bag"></i></a></li>
            <a href="#" id="close"><i class="far fa-times"></i></a>
            <?php
            // Verificar se uma sessão já está ativa
            session_start();
            // Verificar se o usuário está logado
            if (isset($_SESSION['nome'])) {
                // Se estiver logado, exibir o link "Minha Conta" e redirecionar para "perfil.php"
                echo "<li><a  href='perfil.php'>Minha Conta</a></li>";
            } else {
                // Se não estiver logado, exibir o link de login
                echo "<li><a href='login.php' >Login</a></li>";
            }
            session_abort();
            ?>
        </ul>   
    </div>
    <div id="mobile">
        <a  href="cart.php"><i class="fas fa-shopping-bag"></i></a>
        <i id="bar" class="fas fa-outdent"></i>
    </div>
</section>
<!-- end of header section -->

<div align ="center">
<h2>Política de Privacidade</h2>
<p>A sua privacidade é importante para nós. É política da Trendy Closet respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no nosso site.</p>
<br>
<br>
</div>
<br>
<h3>Compartilhamento de Informações</h3>
<p>Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para cumprir com as leis aplicáveis ou proteger os nossos direitos.</p>
<br>
<br>
<h3>Segurança</h3>
<p>Valorizamos a sua confiança ao nos fornecer suas informações pessoais, portanto, estamos empenhados em protegê-las. No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrônico é 100% seguro e confiável, e não podemos garantir absolutamente a segurança dos seus dados.</p>
<br>
<br>
<h3>Alterações à Política de Privacidade</h3>
<p>Reservamo-nos o direito de modificar esta política de privacidade a qualquer momento. Recomendamos que você revise esta página regularmente para estar ciente de quaisquer alterações. As alterações e esclarecimentos terão efeito imediato após a sua publicação no site.</p>
<br>
<br>
<h3>Contato</h3>
<p>Se tiver alguma dúvida sobre esta política de privacidade, entre em contato connosco através do nosso email <strong>tclosetjs@gmail.com.</strong></p>
<br>
<br>
<p>Última atualização no dia <strong>11/03/2024</strong>.</p>






     <!-- footer section -->
     <footer class="section-p1">
        <br>
        <br>
        <div class="col">
            <h4>Contato</h4>
            <p><strong>Morada:</strong> Não existe morada física </p>
            <p><strong>Telemóvel: </strong>+351 232 323 545</p>
        </div>

        <div class="col">
            <h4>Sobre nós</h4>
            <a href="about.php">Sobre nós</a>
            <a href="politicas.php">Políticas de Privacidade</a>
            <a href="contact.php">Contacte-nos</a>
        </div>

        <div class="col">
            <h4>Minha conta</h4>
            <a href="login.php">Login</a>
            <a href="cart.php">Ver carrinho</a>
            <a href="contact.php">Ajuda</a>
        </div>

        <div class="copyright">
            <p> © 2024- Todos os direitos reservados </p>
        </div>
    </footer>
    <!-- end of footer section -->

    <script src="script.js"></script>
</body>
<!-- end of body section -->

</html>
