<?php
// Destination Email
$to = "info@xenonassessors.co.ke";

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 1. Honeypot Check (Spam Protection)
    // If the hidden 'website_url' field is filled, it's a bot.
    if (!empty($_POST['website_url'])) {
        // Silently discard and pretend it worked to confuse the bot.
        header("Location: thanks.html");
        exit;
    }

    // 2. Sanitize Inputs
    $first_name = htmlspecialchars(strip_tags(trim($_POST['first_name'] ?? '')));
    $last_name = htmlspecialchars(strip_tags(trim($_POST['last_name'] ?? '')));
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    $phone = htmlspecialchars(strip_tags(trim($_POST['phone'] ?? '')));
    $message = htmlspecialchars(strip_tags(trim($_POST['message'] ?? '')));

    // 3. Validate Required Fields
    if (empty($first_name) || empty($last_name) || empty($email) || empty($message)) {
        // Redirect back with an error (for MVP we just redirect back)
        header("Location: contact_us.html?error=empty_fields");
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header("Location: contact_us.html?error=invalid_email");
        exit;
    }

    // 4. Construct Email
    $subject = "New Website Inquiry from $first_name $last_name";
    
    $email_content = "You have received a new message from the Xenon website contact form.\n\n";
    $email_content .= "Name: $first_name $last_name\n";
    $email_content .= "Email: $email\n";
    $email_content .= "Phone: $phone\n\n";
    $email_content .= "Message:\n$message\n";

    // 5. Send Email using PHPMailer
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';

    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.example.com'; // TODO: Replace with your SMTP server host
        $mail->SMTPAuth   = true;
        $mail->Username   = 'your_email@example.com'; // TODO: Replace with your SMTP username
        $mail->Password   = 'your_password'; // TODO: Replace with your SMTP password
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS; // Enable implicit TLS encryption
        $mail->Port       = 465; // TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

        // Recipients
        $mail->setFrom('noreply@xenonassessors.co.ke', 'Xenon Website');
        $mail->addAddress($to);
        $mail->addReplyTo($email, "$first_name $last_name");

        // Content
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $email_content;

        $mail->send();
        
        // Success
        header("Location: thanks.html");
        exit;
    } catch (\PHPMailer\PHPMailer\Exception $e) {
        // Failure
        // echo "Mailer Error: " . $mail->ErrorInfo;
        header("Location: contact_us.html?error=dispatch_failed");
        exit;
    }
} else {
    // Not a POST request, send them back
    header("Location: contact_us.html");
    exit;
}
?>
