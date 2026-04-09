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
    <style>
    .pro img {
        width: 500%;
        height: 350px;
    }
    </style>
</head>
<!-- end of head section -->


<!-- body section -->
<body>




<!-- header section -->
<section id="header">
    <a href="index.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a>
    
    <div>
        <ul id="navbar">
            <li><a class="active" href="index.php">Home</a></li>
            <li><a href="shop.php">Shop</a></li>
            <li><a href="about.php">About</a></li>
            <li><a href="contact.php">Contact</a></li>
            <li id="lg-bag"><a href="cart.php"><i class="fas fa-shopping-bag"></i></a></li>
            <a href="#" id="close"><i class="far fa-times"></i></a>
            <?php
            // Verificar se uma sessão já está ativa
            session_start();
            // Verificar se o usuário está logado
            if (isset($_SESSION['nome'])) {
                // Se estiver logado, exibir o link "Minha Conta" e redirecionar para "perfil.php"
                echo "<li><a href='perfil.php'>Minha Conta</a></li>";
            } else {
                // Se não estiver logado, exibir o link de login
                echo "<li><a href='login.php' >Login</a></li>";
            }
            ?>
        </ul>   
    </div>
    <div id="mobile">
        <a  href="cart.php"><i class="fas fa-shopping-bag"></i></a>
        <i id="bar" class="fas fa-outdent"></i>
    </div>
</section>
<!-- end of header section -->



    <!-- hero section -->
    <section id="hero">
        <h2>Moda que combina conforto e elegância, tudo em um só lugar.</h2>
        <h1>Todos os produtos</h1>
        <h4>Descubra o estilo que é a sua cara com nossa seleção exclusiva de roupas.</h4>
        <br>
    </section>
    <!-- end of hero section -->





    <!-- product section -->
    <section id="product1" class="section-p1">
        <?php
            // Conectar ao banco de dados (substitua com suas próprias credenciais)
            $servername = "localhost";
            $username = "root";
            $password = "";
            $dbname = "ecomerce";

            $conexao = new mysqli($servername, $username, $password, $dbname);

            // Verificar a conexão
            if ($conexao->connect_error) {
                die("Falha na conexão: " . $conexao->connect_error);
            }

            // Consulta SQL para obter roupa
            $consultaRoupa = "SELECT * FROM roupa";
            $resultadoRoupa = $conexao->query($consultaRoupa);
        ?>			

        <div class="inner">
            <header id="inner">
                <h1>Novas chegadas!</h1>
                <p>Cadastre-se no nosso site e veja todos os nossos produtos!</p>
                <br>
                <!-- Roupa -->
                <section id="content">

                </section>
        </div>


<!-- product section  -->
<section id="product1" class="section-p1">
			<div class="pro-container">
				<div class="pro">
					<img src="img/shirt1.jpg" alt="">
					<div class="des">
						<div align="center">
							<h5>Camisa azul</h5>
							<div class="star">
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
							</div>
						</div>
					</div>
				</div>
				<div class="pro">
					<img src="img/shirt2.jpg" alt="">
					<div class="des">
						<div align="center">
							<h5>Sweat amarela</h5>
							<div class="star">
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
							</div>
						</div>
					</div>
				</div>
				<div class="pro">
					<img src="img/jeans1.jpg" alt="">
					<div class="des">
						<div align="center">
							<h5>Jeans castanhas</h5>
							<div class="star">
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
							</div>
						</div>
					</div>
				</div>
                <div class="pro">
					<img src="img/coat1.jpg" alt="">
					<div class="des">
						<div align="center">
							<h5>Casaco preto</h5>
							<div class="star">
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
								<i class="fas fa-star"></i>
							</div>
						</div>
					</div>
				</div>
			</div>
            <br>
            <div align = "center">
            <a href="shop.php" class="normal">Ver mais</a>
        </div>
		</section>


 

	<!-- end of product section  -->



        <!-- banners 3 section -->	
        <section id="banner3">
            <div class="banner-box">
                <h2>Arrase com estilo </h2>
                <h3>encontre as peças perfeitas para cada ocasião!</h3>
            </div>
            <div class="banner-box banner-box2">
                <h2>Novas roupas de verão!</h2>
                <h3> Summer 2022</h3>
            </div>
            <div class="banner-box banner-box3">
                <h2>T-SHIRTS</h2>
                <h3>Novos modelos</h3>
            </div>
        </section>
        <!-- end of banners 3 section -->	




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
