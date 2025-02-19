import {
  View,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Keyboard,
} from "react-native";
import { LegacyRef, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import axios from "axios";
import { icons, images } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { useLocationStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";

const LocationTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState<string | undefined>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { userLatitude, userLongitude } = useLocationStore();
  const textInputRef = useRef<TextInput | null>(null);
  const [showCancelTextInput, setShowCancelTextInput] =
    useState<boolean>(false);

  const [enableSearch, setEnableSearch] = useState<boolean>(true);

  const clearInputField = () => {
    textInputRef.current?.clear();
    setSuggestions([]);
    setQuery("");
    setEnableSearch(false);
  };

  useEffect(() => {
    if (query?.length && query.length > 0) {
      setShowCancelTextInput(true);
    } else {
      setSuggestions([]);
      setShowCancelTextInput(false);
    }

    if (textInputRef?.current?.isFocused()) {
      setEnableSearch(true);
    }
  }, [query, setShowCancelTextInput, setEnableSearch, setShowCancelTextInput]);

  // Fetch autocomplete results using Radar's REST API
  const fetchPlaces = async (text: string) => {
    if (text.length < 2 || !enableSearch) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        "https://api.geoapify.com/v1/geocode/autocomplete",
        {
          params: {
            text: text,
            limit: 5, // Number of results
            bias: `proximity:${userLatitude},${userLongitude}`, // Berlin example (lon, lat)
            lang: "en",
            apiKey: `${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
          },
        }
      );

      setSuggestions(response.data.features || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  return (
    <View
      className={`flex flex-row items-center justify-center relative z-50 rounded-xl p-2 ${containerStyle} `}
    >
      <Image
        source={icon || icons.search}
        style={{ width: 22, height: 22 }}
        resizeMode="contain"
      />
      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          fetchPlaces(text);
        }}
        placeholder={initialLocation ?? "Where do you want to go?"}
        placeholderTextColor="gray"
        style={{
          backgroundColor: textInputBackgroundColor || "white",
          fontSize: 16,
          fontWeight: "600",
          padding: 10,
          borderRadius: 20,
          flex: 1,
          shadowColor: "#d4d4d4",
        }}
        ref={textInputRef}
      />
      {showCancelTextInput && (
        <Ionicons name="close-circle" size={28} onPress={clearInputField} />
      )}

      {/* Display suggestions */}
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                handlePress({
                  latitude: item.properties.lat,
                  longitude: item.properties.lon,
                  address: item.properties.formatted,
                });
                clearInputField();
              }}
            >
              <Text
                style={{
                  color: "black",
                  fontWeight: "bold",
                  padding: 10,
                  paddingBottom: 0,
                }}
              >
                {item.properties.address_line1}
              </Text>
              <Text
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderColor: "#ddd",
                  color: "black",
                  paddingRight: 10,
                  paddingTop: 0,
                }}
              >
                {item.properties.address_line2}
              </Text>
            </TouchableOpacity>
          )}
          style={{
            position: "absolute",
            top: 50,
            backgroundColor: "white",
            borderRadius: 10,
            width: "100%",
            zIndex: 99,
            shadowColor: "#d4d4d4",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        />
      )}
    </View>
  );
};

export default LocationTextInput;
