using System.Security.Cryptography;
using System.Text;

const string initializationVector = "pemgail9uzpgzl88";
const string passPhrase = "AAED4554C235927C03BAD5BC313E81B0FBEB6FEC5BB60E682C70A7D5C8890B20";

if (args.Length == 2 && args[0] == "--base64")
{
    Console.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(args[1])));
    return 0;
}

var decrypt = args.Length == 2 && args[0] == "--decrypt";
if (args.Length != 1 && !decrypt)
{
    Console.Error.WriteLine(
        "Usage: CryptoGenerator <plain-text> | CryptoGenerator --base64 <plain-text> | " +
        "CryptoGenerator --decrypt <base64-cipher-text>");
    return 1;
}

var initializationVectorBytes = Encoding.UTF8.GetBytes(initializationVector);
using var password = new PasswordDeriveBytes(passPhrase, null);
var keyBytes = password.GetBytes(256 / 8);

using var symmetricKey = Aes.Create();
symmetricKey.Mode = CipherMode.CBC;
if (decrypt)
{
    try
    {
        var cipherTextBytes = Convert.FromBase64String(args[1]);
        if (cipherTextBytes.Length == 0)
        {
            throw new CryptographicException("Ciphertext cannot be empty.");
        }

        using var decryptor = symmetricKey.CreateDecryptor(keyBytes, initializationVectorBytes);
        var decryptedBytes = decryptor.TransformFinalBlock(cipherTextBytes, 0, cipherTextBytes.Length);
        Console.WriteLine(Encoding.UTF8.GetString(decryptedBytes).Trim());
        return 0;
    }
    catch (Exception exception) when (exception is FormatException or CryptographicException)
    {
        Console.Error.WriteLine("Error: Invalid Base64 ciphertext or incompatible encrypted value.");
        return 1;
    }
}

var plainTextBytes = Encoding.UTF8.GetBytes(args[0] + "                                                          ");
using var encryptor = symmetricKey.CreateEncryptor(keyBytes, initializationVectorBytes);
using var memoryStream = new MemoryStream();
using (var cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
{
    cryptoStream.Write(plainTextBytes, 0, plainTextBytes.Length);
    cryptoStream.FlushFinalBlock();
}

Console.WriteLine(Convert.ToBase64String(memoryStream.ToArray()));
return 0;
