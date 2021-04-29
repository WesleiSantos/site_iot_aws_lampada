#include "FS.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

#define       LedBoard   2                             // WIFI Module LED
#define       BUTTON     D3                            // NodeMCU Button

// Update these with values suitable for your network.

const char* ssid = "LEALNET_Teste";
const char* password = "9966leal";

const long utcOffsetInSeconds = -10800;
char daysOfTheWeek[7][12] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);

const char* AWS_endpoint = "a1u5p9d1s2ikgy-ats.iot.us-east-1.amazonaws.com"; //MQTT broker ip


//============================================================================
#define BUFFER_LEN 256
long lastMsg = 0;
char msg[BUFFER_LEN];
int value = 0;
byte mac[6];
char mac_Id[18];
int mesAux = 0;
int diaAux = 0;
int horasTotais = 0;
int horasAux = -1;
int diaTemporizador = 0;
int periodoTemporizador = 0;
//============================================================================


void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]); // Pring payload content
  }
  char led = (char)payload[11]; // Extracting the controlling command from the Payload to Controlling LED from AWS
  Serial.print("led command=");
  Serial.println(led);
  if (led == 49) // 49 is the ASCI value of 1
  {
    publish(1, 0, 0, 0);
    digitalWrite(2, LOW);
    Serial.println("Led ligou");

  }
  else if (led == 48) // 48 is the ASCI value of 0
  {
    publish(0, mesAux, diaAux, horasTotais);
    horasAux = -1;
    horasTotais = 0;
    diaAux = 0;
    mesAux = 0;
    digitalWrite(2, HIGH);
    Serial.println("Led apagou");
  }
  Serial.println();


}

WiFiClientSecure espClient;
PubSubClient client(AWS_endpoint, 8883, callback, espClient); //set  MQTT port number to 8883 as per //standard

void publish(int num, int mes, int dia, int quantidadeHoras) {
  String macIdStr = mac_Id;
  if (num == 0) {
    snprintf (msg, BUFFER_LEN, "{\"mac_Id\" : \"%s\",\"status\" : \"%s\", \"mes\" : %d, \"dia\" : %d, \"quantidadeHoras\" : %d }", macIdStr.c_str(), "false", mes, dia, quantidadeHoras);
  } else {
    snprintf (msg, BUFFER_LEN, "{\"mac_Id\" : \"%s\", \"status\" : \"%s\"}", macIdStr.c_str(), "true");
  }
  Serial.print("Publish message: ");
  Serial.println(msg);
  client.publish("cmd/esp8266/house/lampada/res", msg);
  Serial.print("Heap: "); Serial.println(ESP.getFreeHeap()); //Low heap can cause problems
}


void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  espClient.setBufferSizes(512, 512);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  timeClient.begin();
  while (!timeClient.update()) {
    timeClient.forceUpdate();
  }

  espClient.setX509Time(timeClient.getEpochTime());

}


void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESPthing")) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("cmd/esp8266/house/lampada/res", "hello world");
      // ... and resubscribe
      client.subscribe("cmd/esp8266/house/lampada/req");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      char buf[256];
      espClient.getLastSSLError(buf, 256);
      Serial.print("WiFiClientSecure SSL error: ");
      Serial.println(buf);

      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup() {

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(2, OUTPUT);
  setup_wifi();
  delay(1000);
  if (!SPIFFS.begin()) {
    Serial.println("Failed to mount file system");
    return;
  }

  Serial.print("Heap: "); Serial.println(ESP.getFreeHeap());

  // Load certificate file
  File cert = SPIFFS.open("/cert.der", "r"); //replace cert.crt eith your uploaded file name
  if (!cert) {
    Serial.println("Failed to open cert file");
  }
  else
    Serial.println("Success to open cert file");

  delay(1000);

  if (espClient.loadCertificate(cert))
    Serial.println("cert loaded");
  else
    Serial.println("cert not loaded");

  // Load private key file
  File private_key = SPIFFS.open("/private.der", "r"); //replace private eith your uploaded file name
  if (!private_key) {
    Serial.println("Failed to open private cert file");
  }
  else
    Serial.println("Success to open private cert file");

  delay(1000);

  if (espClient.loadPrivateKey(private_key))
    Serial.println("private key loaded");
  else
    Serial.println("private key not loaded");



  // Load CA file
  File ca = SPIFFS.open("/ca.der", "r"); //replace ca eith your uploaded file name
  if (!ca) {
    Serial.println("Failed to open ca ");
  }
  else
    Serial.println("Success to open ca");

  delay(1000);

  if (espClient.loadCACert(ca))
    Serial.println("ca loaded");
  else
    Serial.println("ca failed");

  Serial.print("Heap: "); Serial.println(ESP.getFreeHeap());

  //===========================================================================
  WiFi.macAddress(mac);
  snprintf(mac_Id, sizeof(mac_Id), "%02x:%02x:%02x:%02x:%02x:%02x",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  Serial.print(mac_Id);
  //=====================================================================
}



void loop() {

  timeClient.update();

  int horario = timeClient.getHours();
  int minutos = timeClient.getMinutes();
  int segundos = timeClient.getSeconds() + 1;
  int tempoSegundos = (minutos * 60) + segundos;

  int mesCorreto = (horario + 2) / 2;
  int diaCorreto = (horario + 2) % 2 == 0 ? ceil(((float)tempoSegundos / 240)) : ceil(((float)tempoSegundos / 240) + 15);
  int horarioCorreto = (tempoSegundos / 10) % 24;

  Serial.printf("%d/%d : %dh \n ", diaCorreto, mesCorreto, horarioCorreto);

  delay(1000);

  if (!client.connected()) {
    reconnect();
  }

  int lead2 = digitalRead(LedBoard);
  if (lead2 == LOW) {
    Serial.println("veio");
    if (horasAux != horarioCorreto && horasAux != -1 ) {
      horasTotais = horasTotais + 1;
    }
    if (diaAux != diaCorreto && diaAux != 0) {
      Serial.printf("Mes = %d Dia = %d horas = %d \n ", mesAux, diaAux, horasTotais);
      publish(0, mesAux, diaAux, horasTotais);
      horasAux = -1;
      horasTotais = 0;
      diaAux = 0;
      mesAux = 0;
    }
    diaAux = diaCorreto;
    mesAux = mesCorreto;
    horasAux = horarioCorreto;
  }

  if (digitalRead(BUTTON) == LOW) {
    int lead = !digitalRead(LedBoard);
    if (lead == LOW) {
      publish(1, 0, 0, 0);
      Serial.println("Led ligou");
    }
    if (lead == HIGH) {
      Serial.printf("Mes = %d Dia = %d horas = %d \n ", mesAux, diaAux, horasTotais);
      publish(0, mesAux, diaAux, horasTotais);
      horasAux = -1;
      horasTotais = 0;
      diaAux = 0;
      mesAux = 0;
      Serial.println("Led apagou");
    }
    digitalWrite(LedBoard, lead);
    delay(300);
    Serial.println("Botão Pressionado");
  }
  client.loop();
}
