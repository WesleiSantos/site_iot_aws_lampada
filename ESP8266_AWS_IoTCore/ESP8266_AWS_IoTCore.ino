/*Developed by M V Subrahmanyam - https://www.linkedin.com/in/veera-subrahmanyam-mediboina-b63997145/
  Project: Controlling LED from AWS
  Electronics Innovation - www.electronicsinnovation.com
  GitHub - https://github.com/VeeruSubbuAmi
  YouTube - http://bit.ly/Electronics_Innovation
  Upload date:  11 December 2019
  AWS Iot Core
  This example needs https://github.com/esp8266/arduino-esp8266fs-plugin
  It connects to AWS IoT server then:
  - subscribes to the topic "inTopic", and perfprm the action according to the data recieved from the AS
*/
#include "FS.h"
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// Update these with values suitable for your network.

const char* ssid = "LEALNET_Teste";
const char* password = "9966leal";

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

const char* AWS_endpoint = "a1u5p9d1s2ikgy-ats.iot.us-east-1.amazonaws.com"; //MQTT broker ip


//============================================================================
#define BUFFER_LEN 256
long lastMsg = 0;
char msg[BUFFER_LEN];
int value = 0;
byte mac[6];
char mac_Id[18];
int dia=0;
int tempo=0;
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
    publish(1);
    digitalWrite(2, LOW);
    Serial.println("Led ligou");
  }
  else if (led == 48) // 48 is the ASCI value of 0
  {
    publish(0);
    digitalWrite(2, HIGH);
    Serial.println("Led apagou");
  }
  Serial.println();


}

WiFiClientSecure espClient;
PubSubClient client(AWS_endpoint, 8883, callback, espClient); //set  MQTT port number to 8883 as per //standard

void publish(int num) {
  String macIdStr = mac_Id;
  if (num == 0) {
    
      
      snprintf (msg, BUFFER_LEN, "{\"mac_Id\" : \"%s\",\"status\" : \"%s\"}", macIdStr.c_str(), "false");
    }
  } else {
    snprintf (msg, BUFFER_LEN, "{\"mac_Id\" : \"%s\", \"status\" : \"%s\"}", macIdStr.c_str(), "true");
  }
  Serial.print("Publish message: ");
  Serial.println(msg);
  //mqttClient.publish("outTopic", msg);
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

  if (!client.connected()) {
    reconnect();
  }
  
  client.loop();
}
