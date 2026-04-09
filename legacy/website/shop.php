

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DropBox</title>
    <link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" />
    <link rel="stylesheet" href="style.css">
</head>
<style>
    .product-image {
        width: 600px; /* Defina o tamanho desejado para a largura */
        height: 400px; /* Defina o tamanho desejado para a altura */
        object-fit: cover; /* Isso garante que a imagem preencha o contêiner, mantendo a proporção */
    }
</style>
</style>
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


    <!-- hero section -->
    <section id="page-header">
        <h2>Descubra nossas coleções inspiradoras</h2>
        <p></p>
        <br>
    </section>
    <!-- end of hero section -->



    <?php
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

// Query para selecionar os produtos da tabela de produtos
$sql = "SELECT * FROM roupa";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // Início do bloco HTML para todos os produtos
    echo "<section id='product1' class='section-p1'>";
    echo "<div class='pro-container'>";
    
    // Output dos dados de cada produto com o design HTML e CSS
    while ($row = $result->fetch_assoc()) {
        echo "<div class='pro' onclick='window.location.href=\"sproduct.php?id=" . $row['id'] . "\";'>";
        echo "<img class='product-image' src='img/" . $row['imagem'] . "' alt=''>";
        echo "<div class='des'>";
        echo "<span>" . $row['modelo'] . "</span>";
        echo "<h5>" . $row['modelo'] . "</h5>";
        echo "<div class='star'>";
        // Adicionando o código HTML das estrelas
        echo "<i class='fas fa-star'></i>";
        echo "<i class='fas fa-star'></i>";
        echo "<i class='fas fa-star'></i>";
        echo "<i class='fas fa-star'></i>";
        echo "<i class='fas fa-star'></i>";
        echo "</div>";
        echo "<h4>" . $row['preco'] . "€</h4>";
        echo "</div>";
        echo "<a href='#'><i class='fal fa-shopping-cart cart'> </i></a>";
        echo "</div>";
    }
    
    // Fim do bloco HTML para todos os produtos
    echo "</div>";
    echo "</section>";
} else {
    echo "Sem produtos no stock";
}
$conn->close();
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



    <script src="script.js"></script>
</body>
<!-- end of body section -->

</html>
