<?php
header('Content-Type: application/json');

// Destination Email
$to = "info@xenonassessors.co.ke";

// Check if form is submitted via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 1. Honeypot Check (Spam Protection)
    if (!empty($_POST['website_url'])) {
        echo json_encode(["status" => "success"]); // Fake success
        exit;
    }

    // 2. Sanitize Inputs
    $first_name = htmlspecialchars(strip_tags(trim($_POST['first_name'] ?? '')));
    $last_name = htmlspecialchars(strip_tags(trim($_POST['last_name'] ?? '')));
    $phone = htmlspecialchars(strip_tags(trim($_POST['phone'] ?? '')));
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    
    $registration = htmlspecialchars(strip_tags(trim($_POST['registration'] ?? '')));
    $model = htmlspecialchars(strip_tags(trim($_POST['model'] ?? '')));
    $location = htmlspecialchars(strip_tags(trim($_POST['location'] ?? '')));
    $service_type = htmlspecialchars(strip_tags(trim($_POST['service_type'] ?? '')));

    // 3. Validate Required Fields
    if (empty($first_name) || empty($phone) || empty($registration) || empty($model) || empty($service_type)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Please fill in all required fields."]);
        exit;
    }

    // 4. Construct Email
    $subject = "New Service Request: $registration - $service_type";
    
    $email_content = "You have received a new Service Request from the Xenon website.\n\n";
    $email_content .= "--- Client Details ---\n";
    $email_content .= "Name: $first_name $last_name\n";
    $email_content .= "Phone: $phone\n";
    if (!empty($email)) {
        $email_content .= "Email: $email\n";
    }
    $email_content .= "\n--- Vehicle & Service Details ---\n";
    $email_content .= "Vehicle Registration: $registration\n";
    $email_content .= "Vehicle Model: $model\n";
    $email_content .= "Location: $location\n";
    $email_content .= "Service Type: $service_type\n\n";
    $email_content .= "Please find the uploaded photos attached (if any).";

    // 5. Send Email using PHPMailer
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';

    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.example.com'; // TODO: Replace with actual SMTP
        $mail->SMTPAuth   = true;
        $mail->Username   = 'your_email@example.com'; // TODO: Replace with actual SMTP username
        $mail->Password   = 'your_password'; // TODO: Replace with actual SMTP password
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;

        // Recipients
        $mail->setFrom('noreply@xenonassessors.co.ke', 'Xenon Website Service');
        $mail->addAddress($to);

        // Handle Attachments
        if (isset($_FILES['photos'])) {
            $file_count = count($_FILES['photos']['name']);
            for ($i = 0; $i < $file_count; $i++) {
                if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_OK) {
                    $tmp_name = $_FILES['photos']['tmp_name'][$i];
                    $name = basename($_FILES['photos']['name'][$i]);
                    // Attach directly from tmp
                    $mail->addAttachment($tmp_name, $name);
                }
            }
        }

        // Content
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $email_content;

        $mail->send();
        
        // Success
        echo json_encode(["status" => "success"]);
        exit;
    } catch (\PHPMailer\PHPMailer\Exception $e) {
        // Failure
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Message could not be sent."]);
        exit;
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}
?>
