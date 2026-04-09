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
            <li><a href="about.php">About</a></li>
            <li><a class="active" href="contact.php">Contact</a></li>
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
        
        <!-- Contact section -->
        <section id="page-header" class="about-header">
            <h2>Contacte-nos</h2>
            <p>Coloque suas questões e informe-nos de qualquer problema!</p>
        </section>
        <!-- End of contact section -->
        
        <!-- Contact details section -->
        <section id="contact-details" class="section-p1">
            <div class="details">
                <h2>Entre em contacto connosco!</h2>
                <h3>Pode nos contactar por estes meios:</h3>
                <div>
                    <ul>
                        <li>
                            <i class="far fa-envelope"></i>
                            <p>tclosetjs@gmail.com</p>
                        </li>
                        <li>
                            <i class="fas fa-phone-alt"></i>
                            <p>+351 923 434 193</p>
                        </li>
                        <li>
                            <i class="far fa-clock"></i>
                            <p>Das 9h00 ao 12-50 e das 2h10 ás 5h20</p>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="map">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d40418.45790141365!2d-8.42023094629813!3d41.153735913044926!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd2488b57561b4ed%3A0x28d5cfd408959203!2sRecarei-Sobreira!5e0!3m2!1spt-PT!2spt!4v1705491949241!5m2!1spt-PT!2spt" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        </section>
        <!-- End of Contact details section -->
        
        <!-- Form-details section -->
        <section id="form-details">

            <form action="https://formspree.io/f/xbjnkwjl" method="POST" >
                 <label>Nome: <input type="text" name="nome"> </label>
                 <label>Email: <input type="email" name="email"> </label>
                <label> Sua mensagem: <textarea  name="message" > </textarea> </label>
                <button type="submit">Send</button>
            </form>
        </section>
        <!-- End of Form-details section -->
        
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
