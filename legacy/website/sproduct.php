<?php
session_start();

// Verificar se o usuário não está logado
if (!isset($_SESSION['nome'])) {
    echo "<p></p>"; // Exibir mensagem no navegador
    echo "<script>alert('Sem sessão iniciada. Inicie sessão numa conta');</script>";
    header("refresh:0;url=login.php"); // Redirecionar para a página de login após 2 segundos
    exit; // Parar a execução do script após o redirecionamento
}
session_abort();
?>




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
            <li><a class="active" href="shop.php">Shop</a></li>
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
        
        <?php
        // Verificar se o ID do produto está definido na URL
        if(isset($_GET['id'])) {
            // Conexão com o banco de dados
            $servername = "localhost";
            $username = "root";
            $password = "";
            $dbname = "ecomerce";
        
            // Criar conexão
            $conn = new mysqli($servername, $username, $password, $dbname);
        
            // Verificar conexão
            if ($conn->connect_error) {
                die("Connection failed: " . $conn->connect_error);
            }
        
            // Preparar a declaração SQL para buscar os detalhes do produto com base no ID fornecido
            $stmt = $conn->prepare("SELECT modelo, preco, imagem FROM roupa WHERE id = ?");
            $stmt->bind_param("i", $_GET['id']);
            $stmt->execute();
            $stmt->bind_result($modelo, $preco, $imagem);
        
            // Exibir os detalhes do produto
            if ($stmt->fetch()) {
        ?>
        <!-- prodetails section -->
        <section id="prodetails" class="section-p1">
            <div class="single-pro-image">
                <img src="img/<?php echo $imagem; ?>" width="100%" id="MainImg" alt="">
            </div>
        
            <div class="single-pro-details">
                <h6> Home /T-shirt</h6>
                <h4><?php echo $modelo; ?></h4>
                <h2><?php echo $preco; ?>€</h2>
                <form id="cartForm" method="post" action="add_to_cart.php" onsubmit="return validateForm()">
    <input type="hidden" name="id" value="<?php echo $_GET['id']; ?>">
    <input type="hidden" name="imagem" value="<?php echo $imagem; ?>">
    <input type="hidden" name="produto" value="<?php echo $modelo; ?>">
    <input type="hidden" name="preco" value="<?php echo $preco; ?>">
    <select name="tamanho" id="tamanho" onchange="checkSize()">
        <option disabled selected>Selecionar tamanho</option>
        <option>S</option>
        <option>M</option>
        <option>L</option>
        <option>XL</option>
        <option>XXL</option>
        <option>Thais Carla</option>
    </select>
    <input type="number" name="quantidade" id="quantidade" value="1" min="1">
    <button type="submit" class="normal" id="addToCartBtn" disabled>Add To Cart</button>
</form>

<script>
    function checkSize() {
        var tamanho = document.getElementById("tamanho").value;
        var addToCartBtn = document.getElementById("addToCartBtn");
        
        if (tamanho !== '') {
            addToCartBtn.disabled = false;
        } else {
            addToCartBtn.disabled = true;
        }
    }

    function validateForm() {
        var tamanho = document.getElementById("tamanho").value;
        var quantidade = document.getElementById("quantidade").value;

        if (tamanho == '' || quantidade == '' || quantidade <= 0) {
            alert("Por favor, preencha todos os campos corretamente.");
            return false;
        }
        return true;
    }
</script>

                <h2>Product Details</h2>
                <span>
                    Bla bla bla bla blah bla bla, bla bla bla bla
                    Bla bla bla bla blah bla bla, bla bla bla bla
                    Bla bla bla bla blah bla bla, bla bla bla bla.
                </span>
            </div>
        </section>
        <!-- end prodetails section -->
        <?php
            } else {
                echo "Produto não encontrado.";
            }
        
            // Fechar a declaração e a conexão
            $stmt->close();
            $conn->close();
        } else {
            echo "ID do produto não especificado.";
        }
        ?>
        
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
        
        <script>
            var MainImg = document.getElementById("MainImg");
            var smallimg = document.getElementsByClassName("small-img");
        
            smallimg[0].onclick = function(){
                MainImg.src = smallimg[0].src;
            }
            smallimg[1].onclick = function(){
                MainImg.src = smallimg[1].src;
            }
            smallimg[2].onclick = function(){
                MainImg.src = smallimg[2].src;
            }
            smallimg[3].onclick = function(){
                MainImg.src = smallimg[3].src;
            }
        </script>
        
        <script src="script.js"></script>
    </body>
    <!-- end of body section -->
</html>
