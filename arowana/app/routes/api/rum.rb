# Any Sample project Rest APIs locates here
module Arowana
    module RestAPI
        class RUM < BaseAPI
            get '/rest/angular' do
                number = SecureRandom.hex(3).upcase!
                sleep(3)
                return number
            end


            #restiming plugin, trigger POST REST
            post '/rest/beacon' do
              p data = request.body.read.to_s
	            return 'POST service is ready for use!'

            end

            #rt plugin, will trigger the GET REST
            get '/rest/beacon' do
                #chrome will trigger the init boomerang call together with first request
                #ignore it for now
                # if "" == params["rt.quit"]
                #     return "it's a RT start beacon, giving up.."
                # else
                    #Connect to boomcatch server: boomcatch --port 8888 --host 127.0.0.1
                    #Boomcatch server interprets a request URL
                    #converts the data into the StatsD metric format to pass along to DogstatsD
                    #bc_service = `lsof -i:8888`
                    #if !bc_service.empty?
                    #    uri = URI('http://127.0.0.1:8888/beacon')
                    #    uri.query = URI.encode_www_form(params)
                    #    Net::HTTP.get_response(uri)
                    #end
                # end

    	        return 'GET service is ready for use!'
	        end

        end
    end
end
