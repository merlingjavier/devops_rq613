using System.Security.Cryptography;
using System.Text;

const string initializationVector = "pemgail9uzpgzl88";
const string passPhrase = "AAED4554C235927C03BAD5BC313E81B0FBEB6FEC5BB60E682C70A7D5C8890B20";

if (args.Length == 2 && args[0] == "--base64")
{
    Console.WriteLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(args[1])));
    return 0;
}

if (args.Length != 1)
{
    Console.Error.WriteLine("Usage: CryptoGenerator <plain-text> | CryptoGenerator --base64 <plain-text>");
    return 1;
}

var initializationVectorBytes = Encoding.UTF8.GetBytes(initializationVector);
var plainTextBytes = Encoding.UTF8.GetBytes(args[0] + "                                                          ");
var password = new PasswordDeriveBytes(passPhrase, null);
var keyBytes = password.GetBytes(256 / 8);

using var symmetricKey = Aes.Create();
symmetricKey.Mode = CipherMode.CBC;
using var encryptor = symmetricKey.CreateEncryptor(keyBytes, initializationVectorBytes);
using var memoryStream = new MemoryStream();
using (var cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
{
    cryptoStream.Write(plainTextBytes, 0, plainTextBytes.Length);
    cryptoStream.FlushFinalBlock();
}

Console.WriteLine(Convert.ToBase64String(memoryStream.ToArray()));
return 0;
